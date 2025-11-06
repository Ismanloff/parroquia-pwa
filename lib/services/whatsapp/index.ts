/**
 * WhatsApp Service - Main Export
 *
 * Provides a clean interface for WhatsApp integration throughout the application.
 */

export { WhatsAppService } from './whatsapp-service';
export { BaseWhatsAppProvider } from './providers/base';
export { KapsoProvider } from './providers/kapso';
export { MetaProvider } from './providers/meta';

export type {
  WhatsAppMessage,
  MessageContent,
  MessageType,
  SendMessageResponse,
  UploadMediaResponse,
  SendTemplateRequest,
  BusinessProfile,
  WebhookEvent,
  WebhookEventType,
  ProviderType,
  KapsoConfig,
  MetaConfig,
  Contact,
  TemplateComponent,
  TemplateParameter,
  WhatsAppError,
} from './types';
