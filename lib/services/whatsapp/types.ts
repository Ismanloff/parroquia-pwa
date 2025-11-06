/**
 * WhatsApp Service Types
 *
 * Shared types for WhatsApp integration with provider abstraction.
 * Supports both Kapso and Meta Direct API implementations.
 */

export type MessageType = 'text' | 'image' | 'document' | 'video' | 'audio' | 'interactive' | 'template';

export type WebhookEventType =
  | 'message.received'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed'
  | 'message.sent';

export type ProviderType = 'kapso' | 'meta';

/**
 * Message content for different message types
 */
export interface MessageContent {
  text?: string;
  mediaUrl?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  listItems?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

/**
 * WhatsApp message to send
 */
export interface WhatsAppMessage {
  to: string;
  type: MessageType;
  content: string | MessageContent;
  replyTo?: string;
}

/**
 * Business profile information
 */
export interface BusinessProfile {
  about?: string;
  description?: string;
  address?: string;
  email?: string;
  websites?: string[];
  profilePictureUrl?: string;
}

/**
 * WhatsApp contact information
 */
export interface Contact {
  wa_id: string;
  profile?: {
    name: string;
  };
}

/**
 * Webhook event from WhatsApp
 */
export interface WebhookEvent {
  type: WebhookEventType;
  timestamp: Date;
  data: {
    from?: string;
    messageId?: string;
    recipientId?: string;
    type?: string;
    content?: any;
    profile?: {
      name: string;
    };
    error?: {
      code: number;
      title: string;
      message: string;
    };
  };
}

/**
 * Provider configuration for Kapso
 */
export interface KapsoConfig {
  apiKey: string;
  phoneNumberId: string;
  webhookSecret: string;
}

/**
 * Provider configuration for Meta Direct
 */
export interface MetaConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  appSecret: string;
}

/**
 * Response from sending a message
 */
export interface SendMessageResponse {
  messageId: string;
  success: boolean;
  error?: string;
}

/**
 * Response from uploading media
 */
export interface UploadMediaResponse {
  mediaId: string;
  url?: string;
}

/**
 * Template parameter for sending template messages
 */
export interface TemplateParameter {
  type: 'text' | 'image' | 'document' | 'video';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
  video?: { link: string };
}

/**
 * Template component for template messages
 */
export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: TemplateParameter[];
  sub_type?: string;
  index?: number;
}

/**
 * Request to send a template message
 */
export interface SendTemplateRequest {
  to: string;
  templateName: string;
  language?: string;
  components?: TemplateComponent[];
}

/**
 * WhatsApp API error
 */
export interface WhatsAppError {
  code: number;
  title: string;
  message: string;
  errorData?: any;
}
