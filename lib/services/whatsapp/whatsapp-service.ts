/**
 * WhatsApp Service
 *
 * Main orchestrator for WhatsApp integration.
 * Handles provider selection, message routing, and webhook processing.
 */

import { supabase } from '@/lib/supabase';
import { KapsoProvider } from './providers/kapso';
import { MetaProvider } from './providers/meta';
import { decrypt, decryptCredentials, isEncrypted } from '@/lib/security/crypto';
import type { BaseWhatsAppProvider } from './providers/base';
import type {
  WhatsAppMessage,
  SendMessageResponse,
  WebhookEvent,
  ProviderType,
} from './types';

export class WhatsAppService {
  private static providers: Map<string, BaseWhatsAppProvider> = new Map();

  /**
   * Decrypt sensitive channel credentials
   * 🔒 SECURITY FIX #2: Decrypt credentials stored with AES-256-GCM
   */
  private static decryptChannelCredentials(channel: any): any {
    const decrypted = { ...channel };

    try {
      // Decrypt whatsapp_access_token if encrypted
      if (decrypted.whatsapp_access_token && isEncrypted(decrypted.whatsapp_access_token)) {
        decrypted.whatsapp_access_token = decrypt(decrypted.whatsapp_access_token);
      }

      // Decrypt whatsapp_webhook_verify_token if encrypted
      if (decrypted.whatsapp_webhook_verify_token && isEncrypted(decrypted.whatsapp_webhook_verify_token)) {
        decrypted.whatsapp_webhook_verify_token = decrypt(decrypted.whatsapp_webhook_verify_token);
      }

      // Decrypt credentials JSONB object (decrypts apiKey, secret, etc.)
      if (decrypted.credentials && typeof decrypted.credentials === 'object') {
        decrypted.credentials = decryptCredentials(decrypted.credentials);
      }
    } catch (error) {
      console.error('[WhatsApp] Failed to decrypt channel credentials:', error);
      throw new Error('Failed to decrypt channel credentials');
    }

    return decrypted;
  }

  /**
   * Get provider instance for a channel (with caching)
   */
  static async getProvider(channelId: string): Promise<BaseWhatsAppProvider> {
    // Check cache first
    if (this.providers.has(channelId)) {
      return this.providers.get(channelId)!;
    }

    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // Fetch channel config from database
    const { data: channelRaw, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error || !channelRaw) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    // 🔒 SECURITY FIX #2: Decrypt credentials after fetching from database
    const channel = this.decryptChannelCredentials(channelRaw);

    if (channel.type !== 'whatsapp') {
      throw new Error(`Channel ${channelId} is not a WhatsApp channel`);
    }

    if (channel.status !== 'active') {
      throw new Error(`Channel ${channelId} is not active`);
    }

    let provider: BaseWhatsAppProvider;

    // Determine provider type from credentials or environment
    const providerType: ProviderType =
      (channel.credentials as any)?.provider ||
      (process.env.WHATSAPP_PROVIDER as ProviderType) ||
      'kapso';

    if (providerType === 'kapso') {
      // Kapso provider
      const apiKey =
        (channel.credentials as any)?.apiKey || process.env.KAPSO_API_KEY;
      const webhookSecret =
        channel.whatsapp_webhook_verify_token || process.env.KAPSO_WEBHOOK_SECRET;

      if (!apiKey || !channel.whatsapp_phone_number_id || !webhookSecret) {
        throw new Error(
          `Incomplete Kapso configuration for channel ${channelId}`
        );
      }

      provider = new KapsoProvider(channel.workspace_id!, channel.id, {
        apiKey,
        phoneNumberId: channel.whatsapp_phone_number_id,
        webhookSecret,
      });
    } else if (providerType === 'meta') {
      // Meta Direct provider
      const accessToken =
        channel.whatsapp_access_token ||
        process.env.META_WHATSAPP_ACCESS_TOKEN;
      const businessAccountId =
        channel.whatsapp_business_account_id ||
        process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;
      const webhookVerifyToken =
        channel.whatsapp_webhook_verify_token ||
        process.env.META_WEBHOOK_VERIFY_TOKEN;
      const appSecret = process.env.META_APP_SECRET;

      if (
        !accessToken ||
        !channel.whatsapp_phone_number_id ||
        !businessAccountId ||
        !webhookVerifyToken ||
        !appSecret
      ) {
        throw new Error(`Incomplete Meta configuration for channel ${channelId}`);
      }

      provider = new MetaProvider(channel.workspace_id!, channel.id, {
        accessToken,
        phoneNumberId: channel.whatsapp_phone_number_id,
        businessAccountId,
        webhookVerifyToken,
        appSecret,
      });
    } else {
      throw new Error(`Unknown provider type: ${providerType}`);
    }

    // Cache provider
    this.providers.set(channelId, provider);

    return provider;
  }

  /**
   * Clear provider cache (useful for testing or after config changes)
   */
  static clearProviderCache(channelId?: string): void {
    if (channelId) {
      this.providers.delete(channelId);
    } else {
      this.providers.clear();
    }
  }

  /**
   * Send a message via WhatsApp
   */
  static async sendMessage(
    channelId: string,
    message: WhatsAppMessage
  ): Promise<SendMessageResponse> {
    const provider = await this.getProvider(channelId);
    return provider.sendMessage(message);
  }

  /**
   * Upload media and get media ID
   */
  static async uploadMedia(
    channelId: string,
    file: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<string> {
    const provider = await this.getProvider(channelId);
    const result = await provider.uploadMedia(file, mimeType, filename);
    return result.mediaId;
  }

  /**
   * Handle incoming webhook from WhatsApp
   */
  static async handleWebhook(
    channelId: string,
    signature: string,
    body: string,
    payload: any
  ): Promise<void> {
    const provider = await this.getProvider(channelId);

    // Verify webhook signature
    if (!provider.verifyWebhook(signature, body)) {
      throw new Error('Invalid webhook signature');
    }

    // Parse events from webhook
    const events = provider.parseWebhook(payload);

    // Process each event
    for (const event of events) {
      await this.processWebhookEvent(channelId, event);
    }
  }

  /**
   * Process a single webhook event
   */
  private static async processWebhookEvent(
    channelId: string,
    event: WebhookEvent
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // Get channel info
    const { data: channel } = await supabase
      .from('channels')
      .select('workspace_id')
      .eq('id', channelId)
      .single();

    if (!channel) {
      console.error(`Channel ${channelId} not found`);
      return;
    }

    switch (event.type) {
      case 'message.received':
        await this.handleIncomingMessage(
          channel.workspace_id!,
          channelId,
          event.data
        );
        break;

      case 'message.delivered':
      case 'message.read':
      case 'message.failed':
        const status = event.type.split('.')[1];
        if (status) {
          await this.updateMessageStatus(event.data.messageId!, status);
        }
        break;
    }
  }

  /**
   * Handle incoming message from customer
   */
  private static async handleIncomingMessage(
    workspaceId: string,
    channelId: string,
    messageData: any
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const customerPhone = messageData.from;
    const customerName = messageData.profile?.name || customerPhone;

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('channel_id', channelId)
      .eq('customer_phone', customerPhone)
      .eq('status', 'open')
      .maybeSingle();

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          workspace_id: workspaceId,
          channel_id: channelId,
          customer_phone: customerPhone,
          customer_name: customerName,
          status: 'open',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      conversation = newConv;
    }

    // Extract message content
    let content = '';
    let mediaUrl: string | null = null;
    let messageType = messageData.type || 'text';

    if (messageData.content?.text) {
      content = messageData.content.text;
    } else if (messageData.content?.buttonId) {
      content = `Button: ${messageData.content.buttonTitle}`;
      messageType = 'interactive';
    } else if (messageData.content?.listId) {
      content = `List: ${messageData.content.listTitle}`;
      messageType = 'interactive';
    } else if (messageData.content?.mediaId) {
      // Get media URL if needed
      try {
        const provider = await this.getProvider(channelId);
        mediaUrl = await provider.getMediaUrl(messageData.content.mediaId);
        content = messageData.content.caption || `[${messageType}]`;
      } catch (error) {
        console.error('Error getting media URL:', error);
        content = `[${messageType} - failed to load]`;
      }
    } else {
      content = JSON.stringify(messageData.content);
    }

    // Insert message
    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      content,
      message_type: messageType,
      media_url: mediaUrl,
      // TODO: Add metadata field to messages table to store whatsapp_message_id
      // metadata: {
      //   whatsapp_message_id: messageData.messageId,
      //   whatsapp_timestamp: messageData.timestamp,
      // },
    });

    if (messageError) {
      console.error('Error inserting message:', messageError);
      return;
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // Mark message as read in WhatsApp
    try {
      const provider = await this.getProvider(channelId);
      await provider.markAsRead(messageData.messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
      // Don't fail if this doesn't work
    }
  }

  /**
   * Update message delivery status
   * TODO: Uncomment once metadata field is added to messages table
   */
  private static async updateMessageStatus(
    whatsappMessageId: string,
    status: string
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // TODO: Implement after adding metadata field to messages table
    console.log(`[WhatsApp] Message ${whatsappMessageId} status: ${status}`);

    // // Find message by WhatsApp message ID in metadata
    // const { data: message } = await supabase
    //   .from('messages')
    //   .select('id, metadata')
    //   .eq('metadata->>whatsapp_message_id', whatsappMessageId)
    //   .maybeSingle();

    // if (!message) {
    //   // Message not found - might be sent from outside our system
    //   return;
    // }

    // // Update metadata with delivery status
    // const updatedMetadata = {
    //   ...(message.metadata as any),
    //   delivery_status: status,
    //   status_updated_at: new Date().toISOString(),
    // };

    // await supabase
    //   .from('messages')
    //   .update({ metadata: updatedMetadata })
    //   .eq('id', message.id);
  }

  /**
   * Verify webhook for GET requests (Meta requirement)
   */
  static verifyWebhookChallenge(
    mode: string,
    token: string,
    challenge: string
  ): string | null {
    const expectedToken =
      process.env.KAPSO_WEBHOOK_SECRET ||
      process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }

    return null;
  }
}
