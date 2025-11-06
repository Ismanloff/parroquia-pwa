/**
 * WhatsApp Channel Connection API
 *
 * Creates or updates a WhatsApp channel configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { encrypt, encryptCredentials } from '@/lib/security/crypto';

export const runtime = 'nodejs';

/**
 * POST /api/whatsapp/channels/connect
 *
 * Body: {
 *   workspaceId: string;
 *   provider: 'kapso' | 'meta';
 *   name: string;
 *
 *   // Kapso configuration
 *   kapsoApiKey?: string;
 *   kapsoPhoneNumberId?: string;
 *   kapsoWebhookSecret?: string;
 *
 *   // Meta configuration
 *   metaAccessToken?: string;
 *   metaPhoneNumberId?: string;
 *   metaBusinessAccountId?: string;
 *   metaWebhookVerifyToken?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      workspaceId,
      provider = 'kapso',
      name,
      // Kapso fields
      kapsoApiKey,
      kapsoPhoneNumberId,
      kapsoWebhookSecret,
      // Meta fields
      metaAccessToken,
      metaPhoneNumberId,
      metaBusinessAccountId,
      metaWebhookVerifyToken,
    } = body;

    // Validate required fields
    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: 'workspaceId and name are required' },
        { status: 400 }
      );
    }

    // Validate workspace exists
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Validate provider-specific configuration
    let credentials: any = {
      provider,
    };

    let phoneNumberId: string;
    let webhookToken: string;
    let accessToken: string | null = null;
    let businessAccountId: string | null = null;

    if (provider === 'kapso') {
      if (!kapsoApiKey || !kapsoPhoneNumberId || !kapsoWebhookSecret) {
        return NextResponse.json(
          { error: 'Kapso configuration requires: apiKey, phoneNumberId, and webhookSecret' },
          { status: 400 }
        );
      }

      credentials.apiKey = kapsoApiKey;
      phoneNumberId = kapsoPhoneNumberId;
      webhookToken = kapsoWebhookSecret;
    } else if (provider === 'meta') {
      if (
        !metaAccessToken ||
        !metaPhoneNumberId ||
        !metaBusinessAccountId ||
        !metaWebhookVerifyToken
      ) {
        return NextResponse.json(
          {
            error: 'Meta configuration requires: accessToken, phoneNumberId, businessAccountId, and webhookVerifyToken',
          },
          { status: 400 }
        );
      }

      phoneNumberId = metaPhoneNumberId;
      webhookToken = metaWebhookVerifyToken;
      accessToken = metaAccessToken;
      businessAccountId = metaBusinessAccountId;
    } else {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "kapso" or "meta"' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY FIX #2: Encrypt credentials before saving to database
    const encryptedAccessToken = accessToken ? encrypt(accessToken) : null;
    const encryptedWebhookToken = encrypt(webhookToken);
    const encryptedCredentials = encryptCredentials(credentials);

    // Check if channel already exists for this workspace
    const { data: existingChannel } = await supabaseAdmin
      .from('channels')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('type', 'whatsapp')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .maybeSingle();

    if (existingChannel) {
      // Update existing channel
      const { data: updatedChannel, error: updateError } = await supabaseAdmin
        .from('channels')
        .update({
          name,
          whatsapp_access_token: encryptedAccessToken,
          whatsapp_business_account_id: businessAccountId,
          whatsapp_phone_number_id: phoneNumberId,
          whatsapp_webhook_verify_token: encryptedWebhookToken,
          credentials: encryptedCredentials,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingChannel.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating channel:', updateError);
        return NextResponse.json(
          { error: 'Failed to update channel' },
          { status: 500 }
        );
      }

      // Clear provider cache to reload with new config
      WhatsAppService.clearProviderCache(existingChannel.id);

      return NextResponse.json({
        success: true,
        message: 'Channel updated successfully',
        channel: updatedChannel,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhooks?channelId=${updatedChannel.id}`,
      });
    }

    // Create new channel (credentials already encrypted above)
    const { data: newChannel, error: insertError } = await supabaseAdmin
      .from('channels')
      .insert({
        workspace_id: workspaceId,
        name,
        type: 'whatsapp',
        whatsapp_access_token: encryptedAccessToken,
        whatsapp_business_account_id: businessAccountId,
        whatsapp_phone_number_id: phoneNumberId,
        whatsapp_webhook_verify_token: encryptedWebhookToken,
        credentials: encryptedCredentials,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating channel:', insertError);
      return NextResponse.json(
        { error: 'Failed to create channel' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Channel created successfully',
      channel: newChannel,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhooks?channelId=${newChannel.id}`,
      instructions: {
        nextSteps: [
          `Configure your webhook URL in ${provider === 'kapso' ? 'Kapso dashboard' : 'Meta Business Manager'}:`,
          `URL: ${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhooks?channelId=${newChannel.id}`,
          `Verify Token: ${webhookToken}`,
          'Subscribe to messages and message_status events',
        ],
      },
    });
  } catch (error: any) {
    console.error('[Connect channel error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/channels/connect
 *
 * List all WhatsApp channels for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const { data: channels, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('type', 'whatsapp')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching channels:', error);
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      );
    }

    // Remove sensitive data before sending
    const sanitizedChannels = (channels || []).map((channel) => ({
      ...channel,
      whatsapp_access_token: channel.whatsapp_access_token ? '***' : null,
      credentials: channel.credentials
        ? { provider: (channel.credentials as any).provider }
        : null,
    }));

    return NextResponse.json({
      success: true,
      channels: sanitizedChannels,
    });
  } catch (error: any) {
    console.error('[List channels error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
