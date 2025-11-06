/**
 * Kapso WhatsApp Provider
 *
 * Implementation using Kapso's managed WhatsApp Cloud API proxy.
 * Provides quick setup, multi-tenant support, and additional features.
 *
 * TEMPORARILY DISABLED - Missing @kapso/whatsapp-cloud-api dependency
 */

// import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
type WhatsAppClient = any; // Temporary placeholder
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
  KapsoConfig,
} from '../types';

export class KapsoProvider extends BaseWhatsAppProvider {
  private client: WhatsAppClient;
  private phoneNumberId: string;
  private webhookSecret: string;

  constructor(
    workspaceId: string,
    channelId: string,
    config: KapsoConfig
  ) {
    super(workspaceId, channelId);

    this.client = new WhatsAppClient({
      baseUrl: 'https://api.kapso.ai/meta/whatsapp',
      kapsoApiKey: config.apiKey,
    });

    this.phoneNumberId = config.phoneNumberId;
    this.webhookSecret = config.webhookSecret;
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

      let result: any;

      switch (message.type) {
        case 'text':
          result = await this.client.messages.sendText({
            phoneNumberId: this.phoneNumberId,
            to,
            body: message.content as string,
          });
          break;

        case 'image':
          const imageContent = message.content as MessageContent;
          result = await this.client.messages.sendImage({
            phoneNumberId: this.phoneNumberId,
            to,
            image: imageContent.mediaUrl
              ? { link: imageContent.mediaUrl, caption: imageContent.caption }
              : { id: imageContent.mediaId!, caption: imageContent.caption },
          });
          break;

        case 'document':
          const docContent = message.content as MessageContent;
          result = await this.client.messages.sendDocument({
            phoneNumberId: this.phoneNumberId,
            to,
            document: docContent.mediaUrl
              ? { link: docContent.mediaUrl, caption: docContent.caption, filename: docContent.filename }
              : { id: docContent.mediaId!, caption: docContent.caption, filename: docContent.filename },
          });
          break;

        case 'video':
          const videoContent = message.content as MessageContent;
          result = await this.client.messages.sendVideo({
            phoneNumberId: this.phoneNumberId,
            to,
            video: videoContent.mediaUrl
              ? { link: videoContent.mediaUrl, caption: videoContent.caption }
              : { id: videoContent.mediaId!, caption: videoContent.caption },
          });
          break;

        case 'audio':
          const audioContent = message.content as MessageContent;
          result = await this.client.messages.sendAudio({
            phoneNumberId: this.phoneNumberId,
            to,
            audio: audioContent.mediaUrl
              ? { link: audioContent.mediaUrl }
              : { id: audioContent.mediaId! },
          });
          break;

        case 'interactive':
          const interactiveContent = message.content as MessageContent;
          if (interactiveContent.buttons) {
            result = await this.client.messages.sendInteractiveButtons({
              phoneNumberId: this.phoneNumberId,
              to,
              bodyText: interactiveContent.text!,
              buttons: interactiveContent.buttons.map((btn, idx) => ({
                id: btn.id || `btn_${idx}`,
                title: btn.title,
              })),
            });
          } else if (interactiveContent.listItems) {
            result = await this.client.messages.sendInteractiveList({
              phoneNumberId: this.phoneNumberId,
              to,
              bodyText: interactiveContent.text!,
              buttonText: 'Options',
              sections: [
                {
                  title: 'Menu',
                  rows: interactiveContent.listItems.map((item) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                  })),
                },
              ],
            });
          }
          break;

        default:
          return {
            messageId: '',
            success: false,
            error: `Unsupported message type: ${message.type}`,
          };
      }

      await this.logMessage('outbound', { to, type: message.type, result });

      return {
        messageId: result.messages[0].id,
        success: true,
      };
    } catch (error: any) {
      console.error('[Kapso sendMessage error]', error);
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
      const result = await this.client.media.upload({
        phoneNumberId: this.phoneNumberId,
        file,
        type: mimeType,
        fileName: filename,
      });

      return {
        mediaId: result.id,
      };
    } catch (error) {
      this.handleError(error, 'uploadMedia');
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      // Note: Kapso may not have a retrieve method, might need to construct URL
      // or use different approach. For now, return a placeholder.
      // TODO: Check Kapso documentation for correct method
      return `https://api.kapso.ai/media/${mediaId}`;
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

      const result = await this.client.messages.sendTemplate({
        phoneNumberId: this.phoneNumberId,
        to,
        template: {
          name: request.templateName,
          language: {
            code: request.language || 'en_US',
          },
          components: request.components as any || [],
        },
      });

      return {
        messageId: result?.messages?.[0]?.id || '',
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

  async updateBusinessProfile(_profile: BusinessProfile): Promise<void> {
    try {
      // Note: Kapso API may not have updateProfile method
      // This is a placeholder - check Kapso documentation
      console.warn('[Kapso] updateBusinessProfile not implemented yet');
      // await this.client.phoneNumbers.updateProfile({
      //   phoneNumberId: this.phoneNumberId,
      //   about: _profile.about,
      //   description: _profile.description,
      //   address: _profile.address,
      //   email: _profile.email,
      //   websites: _profile.websites,
      // });
    } catch (error) {
      this.handleError(error, 'updateBusinessProfile');
    }
  }

  verifyWebhook(signature: string, body: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('[Kapso verifyWebhook error]', error);
      return false;
    }
  }

  parseWebhook(payload: any): WebhookEvent[] {
    const events: WebhookEvent[] = [];

    try {
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
      console.error('[Kapso parseWebhook error]', error);
    }

    return events;
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.client.messages.markRead({
        phoneNumberId: this.phoneNumberId,
        messageId: messageId,
      });
    } catch (error) {
      console.error('[Kapso markAsRead error]', error);
      // Don't throw - marking as read is not critical
    }
  }
}
