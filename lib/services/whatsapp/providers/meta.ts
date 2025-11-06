/**
 * Meta WhatsApp Provider
 *
 * Direct implementation using Meta's WhatsApp Cloud API.
 * Provides full control and lower costs but requires more setup.
 */

import crypto from 'crypto';
import { BaseWhatsAppProvider } from './base';
import type {
  WhatsAppMessage,
  SendMessageResponse,
  UploadMediaResponse,
  SendTemplateRequest,
  BusinessProfile,
  WebhookEvent,
  MessageContent,
  MetaConfig,
} from '../types';

export class MetaProvider extends BaseWhatsAppProvider {
  private accessToken: string;
  private phoneNumberId: string;
  private _businessAccountId: string; // Reserved for future use
  private _webhookVerifyToken: string; // Reserved for future use
  private appSecret: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    workspaceId: string,
    channelId: string,
    config: MetaConfig
  ) {
    super(workspaceId, channelId);

    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this._businessAccountId = config.businessAccountId;
    this._webhookVerifyToken = config.webhookVerifyToken;
    this.appSecret = config.appSecret;
  }

  async sendMessage(message: WhatsAppMessage): Promise<SendMessageResponse> {
    try {
      const to = this.formatPhoneNumber(message.to);

      if (!this.isValidPhoneNumber(to)) {
        return {
          messageId: '',
          success: false,
          error: 'Invalid phone number format',
        };
      }

      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      let payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
      };

      switch (message.type) {
        case 'text':
          payload.type = 'text';
          payload.text = { body: message.content as string };
          break;

        case 'image':
          const imageContent = message.content as MessageContent;
          payload.type = 'image';
          payload.image = imageContent.mediaUrl
            ? { link: imageContent.mediaUrl }
            : { id: imageContent.mediaId };
          if (imageContent.caption) {
            payload.image.caption = imageContent.caption;
          }
          break;

        case 'document':
          const docContent = message.content as MessageContent;
          payload.type = 'document';
          payload.document = docContent.mediaUrl
            ? { link: docContent.mediaUrl }
            : { id: docContent.mediaId };
          if (docContent.caption) {
            payload.document.caption = docContent.caption;
          }
          if (docContent.filename) {
            payload.document.filename = docContent.filename;
          }
          break;

        case 'video':
          const videoContent = message.content as MessageContent;
          payload.type = 'video';
          payload.video = videoContent.mediaUrl
            ? { link: videoContent.mediaUrl }
            : { id: videoContent.mediaId };
          if (videoContent.caption) {
            payload.video.caption = videoContent.caption;
          }
          break;

        case 'audio':
          const audioContent = message.content as MessageContent;
          payload.type = 'audio';
          payload.audio = audioContent.mediaUrl
            ? { link: audioContent.mediaUrl }
            : { id: audioContent.mediaId };
          break;

        case 'interactive':
          const interactiveContent = message.content as MessageContent;
          payload.type = 'interactive';

          if (interactiveContent.buttons) {
            payload.interactive = {
              type: 'button',
              body: { text: interactiveContent.text! },
              action: {
                buttons: interactiveContent.buttons.slice(0, 3).map((btn) => ({
                  type: 'reply',
                  reply: {
                    id: btn.id,
                    title: btn.title.substring(0, 20), // Max 20 chars
                  },
                })),
              },
            };
          } else if (interactiveContent.listItems) {
            payload.interactive = {
              type: 'list',
              body: { text: interactiveContent.text! },
              action: {
                button: 'Options',
                sections: [
                  {
                    title: 'Menu',
                    rows: interactiveContent.listItems.slice(0, 10).map((item) => ({
                      id: item.id,
                      title: item.title.substring(0, 24), // Max 24 chars
                      description: item.description?.substring(0, 72), // Max 72 chars
                    })),
                  },
                ],
              },
            };
          }
          break;

        default:
          return {
            messageId: '',
            success: false,
            error: `Unsupported message type: ${message.type}`,
          };
      }

      if (message.replyTo) {
        payload.context = { message_id: message.replyTo };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Meta API error]', error);
        return {
          messageId: '',
          success: false,
          error: error.error?.message || 'Failed to send message',
        };
      }

      const result = await response.json();
      await this.logMessage('outbound', { to, type: message.type, result });

      return {
        messageId: result.messages[0].id,
        success: true,
      };
    } catch (error: any) {
      console.error('[Meta sendMessage error]', error);
      return {
        messageId: '',
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }

  async uploadMedia(
    file: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<UploadMediaResponse> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/media`;

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(file)], { type: mimeType });
      formData.append('file', blob, filename);
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', mimeType);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upload media');
      }

      const result = await response.json();

      return {
        mediaId: result.id,
      };
    } catch (error) {
      this.handleError(error, 'uploadMedia');
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/${mediaId}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get media URL');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      this.handleError(error, 'getMediaUrl');
    }
  }

  async sendTemplate(request: SendTemplateRequest): Promise<SendMessageResponse> {
    try {
      const to = this.formatPhoneNumber(request.to);

      if (!this.isValidPhoneNumber(to)) {
        return {
          messageId: '',
          success: false,
          error: 'Invalid phone number format',
        };
      }

      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: request.templateName,
          language: {
            code: request.language || 'en_US',
          },
          components: request.components || [],
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          messageId: '',
          success: false,
          error: error.error?.message || 'Failed to send template',
        };
      }

      const result = await response.json();

      return {
        messageId: result.messages[0].id,
        success: true,
      };
    } catch (error: any) {
      return {
        messageId: '',
        success: false,
        error: error.message || 'Failed to send template',
      };
    }
  }

  async updateBusinessProfile(profile: BusinessProfile): Promise<void> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/whatsapp_business_profile`;

      const payload: any = {
        messaging_product: 'whatsapp',
      };

      if (profile.about) payload.about = profile.about;
      if (profile.address) payload.address = profile.address;
      if (profile.description) payload.description = profile.description;
      if (profile.email) payload.email = profile.email;
      if (profile.websites) payload.websites = profile.websites;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      this.handleError(error, 'updateBusinessProfile');
    }
  }

  verifyWebhook(signature: string, body: string): boolean {
    try {
      // Meta uses X-Hub-Signature-256 header
      // Format: "sha256=<signature>"
      const expectedSignature =
        'sha256=' +
        crypto.createHmac('sha256', this.appSecret).update(body).digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('[Meta verifyWebhook error]', error);
      return false;
    }
  }

  parseWebhook(payload: any): WebhookEvent[] {
    const events: WebhookEvent[] = [];

    try {
      // Meta webhook format is identical to Kapso (since Kapso proxies Meta)
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // Parse incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              events.push({
                type: 'message.received',
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                data: {
                  from: message.from,
                  messageId: message.id,
                  type: message.type,
                  content: this.extractMessageContent(message),
                  profile: value.contacts?.[0]?.profile,
                },
              });
            }
          }

          // Parse message statuses
          if (value.statuses) {
            for (const status of value.statuses) {
              const eventType =
                status.status === 'sent'
                  ? 'message.sent'
                  : status.status === 'delivered'
                  ? 'message.delivered'
                  : status.status === 'read'
                  ? 'message.read'
                  : status.status === 'failed'
                  ? 'message.failed'
                  : null;

              if (eventType) {
                events.push({
                  type: eventType,
                  timestamp: new Date(parseInt(status.timestamp) * 1000),
                  data: {
                    messageId: status.id,
                    recipientId: status.recipient_id,
                    error: status.errors?.[0],
                  },
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[Meta parseWebhook error]', error);
    }

    return events;
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[Meta markAsRead error]', error);
      // Don't throw - marking as read is not critical
    }
  }
}
