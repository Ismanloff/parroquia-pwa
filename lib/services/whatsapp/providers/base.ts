/**
 * Base WhatsApp Provider
 *
 * Abstract interface that all WhatsApp providers must implement.
 * This enables seamless switching between Kapso and Meta Direct API.
 */

import type {
  WhatsAppMessage,
  SendMessageResponse,
  UploadMediaResponse,
  SendTemplateRequest,
  BusinessProfile,
  WebhookEvent,
} from '../types';

/**
 * Abstract base class for WhatsApp providers
 */
export abstract class BaseWhatsAppProvider {
  protected workspaceId: string;
  protected channelId: string;

  constructor(workspaceId: string, channelId: string) {
    this.workspaceId = workspaceId;
    this.channelId = channelId;
  }

  /**
   * Send a message via WhatsApp
   */
  abstract sendMessage(message: WhatsAppMessage): Promise<SendMessageResponse>;

  /**
   * Upload media to WhatsApp
   */
  abstract uploadMedia(
    file: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<UploadMediaResponse>;

  /**
   * Get media URL from media ID
   */
  abstract getMediaUrl(mediaId: string): Promise<string>;

  /**
   * Send a template message
   */
  abstract sendTemplate(request: SendTemplateRequest): Promise<SendMessageResponse>;

  /**
   * Update business profile
   */
  abstract updateBusinessProfile(profile: BusinessProfile): Promise<void>;

  /**
   * Verify webhook signature
   */
  abstract verifyWebhook(signature: string, body: string): boolean;

  /**
   * Parse webhook payload into events
   */
  abstract parseWebhook(payload: any): WebhookEvent[];

  /**
   * Mark message as read
   */
  abstract markAsRead(messageId: string): Promise<void>;

  // ============================================
  // Shared utility methods
  // ============================================

  /**
   * Format phone number to E.164 format (removes all non-numeric characters)
   */
  protected formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Ensure it has a country code
    if (!cleaned.startsWith('1') && !cleaned.startsWith('3') && cleaned.length === 10) {
      // Assume US/Canada if 10 digits without country code
      return '1' + cleaned;
    }

    return cleaned;
  }

  /**
   * Validate phone number format
   */
  protected isValidPhoneNumber(phone: string): boolean {
    const cleaned = this.formatPhoneNumber(phone);
    // Should be at least 10 digits (country code + number)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Extract message content based on message type
   */
  protected extractMessageContent(message: any): any {
    switch (message.type) {
      case 'text':
        return { text: message.text?.body };

      case 'image':
        return {
          mediaId: message.image?.id,
          caption: message.image?.caption,
          mimeType: message.image?.mime_type,
        };

      case 'document':
        return {
          mediaId: message.document?.id,
          filename: message.document?.filename,
          caption: message.document?.caption,
          mimeType: message.document?.mime_type,
        };

      case 'audio':
        return {
          mediaId: message.audio?.id,
          mimeType: message.audio?.mime_type,
        };

      case 'video':
        return {
          mediaId: message.video?.id,
          caption: message.video?.caption,
          mimeType: message.video?.mime_type,
        };

      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          return {
            buttonId: message.interactive.button_reply.id,
            buttonTitle: message.interactive.button_reply.title,
          };
        } else if (message.interactive?.type === 'list_reply') {
          return {
            listId: message.interactive.list_reply.id,
            listTitle: message.interactive.list_reply.title,
            listDescription: message.interactive.list_reply.description,
          };
        }
        return message.interactive;

      case 'location':
        return {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };

      case 'contacts':
        return {
          contacts: message.contacts,
        };

      default:
        return message;
    }
  }

  /**
   * Log message for debugging (override in subclass for custom logging)
   */
  protected async logMessage(
    direction: 'inbound' | 'outbound',
    message: any
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WhatsApp ${direction.toUpperCase()}]`, {
        workspaceId: this.workspaceId,
        channelId: this.channelId,
        timestamp: new Date().toISOString(),
        message,
      });
    }
  }

  /**
   * Handle API errors consistently
   */
  protected handleError(error: any, context: string): never {
    console.error(`[WhatsApp Error - ${context}]`, {
      workspaceId: this.workspaceId,
      channelId: this.channelId,
      error,
    });

    throw new Error(
      `WhatsApp ${context} failed: ${error.message || JSON.stringify(error)}`
    );
  }
}
