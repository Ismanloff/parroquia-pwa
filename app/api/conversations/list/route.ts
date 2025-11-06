import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { withWorkspaceAuth } from '@/lib/api/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withWorkspaceAuth(
    req,
    async ({ user, workspaceId, membership }) => {
      try {
        if (!supabaseAdmin) {
          return NextResponse.json(
            { error: 'Database not configured' },
            { status: 500 }
          );
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const status = searchParams.get('status'); // 'active', 'archived', 'closed'

        console.log('Listing conversations:', {
          workspaceId,
          limit,
          offset,
          status,
          userId: user.id,
          role: membership.role
        });

        // Build query with joins for workspace and customer details
        let query = supabaseAdmin
          .from('conversations')
          .select(`
            *,
            workspace:workspaces!inner(name),
            messages(count, content, created_at)
          `, { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data: conversations, error, count } = await query;

        if (error) {
          console.error('Error listing conversations:', error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }

        // Transform data to flatten joined relationships
        const transformedConversations = (conversations || []).map((conv: any) => {
          // Get messages array and find latest
          const messages = Array.isArray(conv.messages) ? conv.messages : [];
          const messagesCount = messages.length;
          const lastMessage = messages.length > 0
            ? messages.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]?.content || ''
            : '';

          return {
            ...conv,
            workspace_name: conv.workspace?.name || 'Unknown Workspace',
            user_email: conv.customer_phone || conv.customer_name || 'Unknown User',
            messages_count: messagesCount,
            last_message: lastMessage,
            // Clean up nested objects
            workspace: undefined,
            messages: undefined,
          };
        });

        return NextResponse.json({
          success: true,
          conversations: transformedConversations,
          total: count || 0,
          limit,
          offset,
        });
      } catch (error: any) {
        console.error('Error in list conversations:', error);
        return NextResponse.json(
          { error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    },
    { workspaceIdSource: 'query' } // workspaceId comes from query params
  );
}
