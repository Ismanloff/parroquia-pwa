/**
 * WhatsApp Webhooks API Route
 *
 * Handles webhook verification (GET) and incoming messages (POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/services/whatsapp';

/**
 * GET - Webhook Verification
 *
 * Required by Meta/WhatsApp to verify webhook endpoint
 * URL format: /api/whatsapp/webhooks?channelId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return new Response('Missing parameters', { status: 400 });
    }

    // Verify webhook
    const verifiedChallenge = WhatsAppService.verifyWebhookChallenge(
      mode,
      token,
      challenge
    );

    if (verifiedChallenge) {
      return new Response(verifiedChallenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    console.error('[Webhook GET error]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * POST - Receive Webhook Events
 *
 * Processes incoming messages and status updates from WhatsApp
 * URL format: /api/whatsapp/webhooks?channelId=xxx
 */
export async function POST(request: NextRequest) {
  try {
    // Get channel ID from query params
    const channelId = request.nextUrl.searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID required' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    const payload = JSON.parse(body);

    // Get signature from headers (different for Kapso vs Meta)
    const signature =
      request.headers.get('x-webhook-signature') || // Kapso
      request.headers.get('x-hub-signature-256') || // Meta
      '';

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    // Process webhook
    await WhatsAppService.handleWebhook(channelId, signature, body, payload);

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Webhook POST error]', error);

    // Still return 200 to prevent WhatsApp from retrying
    // Log the error for debugging
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 200 }
    );
  }
}
