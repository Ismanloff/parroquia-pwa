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
 * GET /api/analytics/overview?workspaceId=xxx&period=7d
 * Retorna métricas generales del workspace
 *
 * Periods: 24h, 7d, 30d, 90d, all
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const period = searchParams.get('period') || '7d';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2000-01-01');
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // 1. Total Conversations
    const { count: totalConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    // 2. Total Messages
    const { count: totalMessages } = await supabaseAdmin
      .from('messages')
      .select('*, conversation:conversations!inner(workspace_id)', { count: 'exact', head: true })
      .eq('conversation.workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    // 3. AI Messages (to calculate AI usage)
    const { count: aiMessages } = await supabaseAdmin
      .from('messages')
      .select('*, conversation:conversations!inner(workspace_id)', { count: 'exact', head: true })
      .eq('conversation.workspace_id', workspaceId)
      .eq('ai_response', true)
      .gte('created_at', startDate.toISOString());

    // 4. Active Conversations (with messages in period)
    const { count: activeConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'open')
      .gte('updated_at', startDate.toISOString());

    // 5. Documents Count
    const { count: totalDocuments } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // 6. Team Members Count
    const { count: teamMembers } = await supabaseAdmin
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // 7. Messages by Day (last 7 days for chart)
    const { data: messagesData } = await supabaseAdmin
      .from('messages')
      .select('created_at, conversation:conversations!inner(workspace_id)')
      .eq('conversation.workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group messages by day
    const messagesByDay: { [key: string]: number } = {};
    messagesData?.forEach((msg) => {
      const date = new Date(msg.created_at).toISOString().split('T')[0];
      if (date) {
        messagesByDay[date] = (messagesByDay[date] || 0) + 1;
      }
    });

    // 8. Analytics Events Summary
    const { data: eventsData } = await supabaseAdmin
      .from('analytics_events')
      .select('event_type')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    const eventsSummary: { [key: string]: number } = {};
    eventsData?.forEach((event) => {
      eventsSummary[event.event_type] = (eventsSummary[event.event_type] || 0) + 1;
    });

    // 9. Average Response Time (calculate from messages)
    const { data: conversationMessages } = await supabaseAdmin
      .from('messages')
      .select('created_at, sender_type, conversation_id, conversation:conversations!inner(workspace_id)')
      .eq('conversation.workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .order('conversation_id', { ascending: true })
      .order('created_at', { ascending: true });

    let totalResponseTime = 0;
    let responseCount = 0;

    // Calculate time between customer message and AI/agent response
    if (conversationMessages) {
      let lastCustomerMessage: Date | null = null;

      for (const msg of conversationMessages) {
        if (msg.sender_type === 'customer') {
          lastCustomerMessage = new Date(msg.created_at);
        } else if (lastCustomerMessage && (msg.sender_type === 'ai' || msg.sender_type === 'agent')) {
          const responseTime = new Date(msg.created_at).getTime() - lastCustomerMessage.getTime();
          totalResponseTime += responseTime;
          responseCount++;
          lastCustomerMessage = null;
        }
      }
    }

    const avgResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const avgResponseTimeSeconds = Math.round(avgResponseTimeMs / 1000);

    return NextResponse.json({
      success: true,
      period,
      stats: {
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        aiMessages: aiMessages || 0,
        activeConversations: activeConversations || 0,
        totalDocuments: totalDocuments || 0,
        teamMembers: teamMembers || 0,
        avgResponseTimeSeconds,
        messagesByDay,
        eventsSummary,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
