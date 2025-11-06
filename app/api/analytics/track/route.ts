import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/analytics/track
 * Registra un evento de analytics
 *
 * Body: {
 *   workspaceId: string,
 *   eventType: string,
 *   eventData?: object,
 *   userId?: string,
 *   sessionId?: string
 * }
 *
 * Event types:
 * - conversation_created
 * - message_sent
 * - message_received
 * - document_uploaded
 * - document_deleted
 * - widget_opened
 * - widget_message_sent
 * - team_member_invited
 * - team_member_removed
 */
export async function POST(req: NextRequest) {
  try {
    const { workspaceId, eventType, eventData, userId, sessionId } = await req.json();

    if (!workspaceId || !eventType) {
      return NextResponse.json(
        { error: 'workspaceId and eventType are required' },
        { status: 400 }
      );
    }

    // Validate workspace exists
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Insert analytics event
    const { data, error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        workspace_id: workspaceId,
        event_type: eventType,
        event_data: eventData || {},
        user_id: userId || null,
        session_id: sessionId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking analytics event:', error);
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data,
    });
  } catch (error) {
    console.error('Error in POST /api/analytics/track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
