/**
 * WhatsApp Send Message API
 *
 * Sends a message via WhatsApp through the configured provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'nodejs';

/**
 * POST /api/whatsapp/send-message
 *
 * Body: {
 *   channelId: string;
 *   to: string;  // Phone number in E.164 format or local format
 *   type: 'text' | 'image' | 'document' | 'video' | 'audio' | 'interactive' | 'template';
 *   content: string | MessageContent;
 *   conversationId?: string; // Optional - to link message to conversation
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
    const { channelId, to, type, content, conversationId } = body;

    // Validate required fields
    if (!channelId || !to || !type || !content) {
      return NextResponse.json(
        { error: 'channelId, to, type, and content are required' },
        { status: 400 }
      );
    }

    // Validate channel exists and is active
    const { data: channel, error: channelError } = await supabaseAdmin
      .from('channels')
      .select('id, workspace_id, type, status')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    if (channel.type !== 'whatsapp') {
      return NextResponse.json(
        { error: 'Channel is not a WhatsApp channel' },
        { status: 400 }
      );
    }

    if (channel.status !== 'active') {
      return NextResponse.json(
        { error: 'Channel is not active' },
        { status: 400 }
      );
    }

    // Send message via WhatsApp
    const result = await WhatsAppService.sendMessage(channelId, {
      to,
      type,
      content,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }

    // If conversationId provided, save message to database
    if (conversationId) {
      // Verify conversation exists and belongs to same workspace
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select('id, workspace_id, customer_phone')
        .eq('id', conversationId)
        .single();

      if (conversation && conversation.workspace_id === channel.workspace_id) {
        // Save message to database
        await supabaseAdmin.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          content: typeof content === 'string' ? content : content.text || JSON.stringify(content),
          message_type: type,
          media_url: typeof content === 'object' ? content.mediaUrl : null,
          metadata: {
            whatsapp_message_id: result.messageId,
            sent_at: new Date().toISOString(),
          },
        });

        // Update conversation last_message_at
        await supabaseAdmin
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    console.error('[Send message error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
