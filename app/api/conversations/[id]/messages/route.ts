import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { resend, FROM_EMAIL } from '@/app/lib/resend';
import { conversationNotificationEmailTemplate } from '@/app/lib/email-templates';

export const runtime = 'nodejs';

// POST add message to conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { id: conversationId } = await params;
    const body = await req.json();
    const {
      role,
      content,
    } = body;

    // Validate inputs
    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be user, assistant, or system' },
        { status: 400 }
      );
    }

    console.log('Adding message to conversation:', conversationId, { role, contentLength: content.length });

    // Insert message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: role,
        content: content,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 }
      );
    }

    // Update conversation's updated_at
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log('Message created:', message.id);

    // Send notification email if message is from a customer (user role, not assistant)
    if (role === 'user') {
      try {
        // Get conversation and workspace details
        const { data: conversation, error: convError } = await supabaseAdmin
          .from('conversations')
          .select('workspace_id, user_id, metadata')
          .eq('id', conversationId)
          .single();

        if (conversation && !convError && 'workspace_id' in conversation && 'user_id' in conversation && 'metadata' in conversation) {
          const workspaceId = String(conversation.workspace_id);
          const { data: workspace, error: wsError } = await supabaseAdmin
            .from('workspaces')
            .select('name')
            .eq('id', workspaceId)
            .single();

          // Get admin members to notify
          const { data: admins } = await supabaseAdmin
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .in('role', ['admin', 'owner']);

          if (admins && admins.length > 0 && workspace && !wsError && 'name' in workspace) {
            // Get customer name from conversation metadata
            const metadata = conversation.metadata as any;
            const customerName = metadata?.customer_name ||
                                metadata?.name ||
                                String(conversation.user_id).substring(0, 8);

            // Get message preview (first 100 characters)
            const messagePreview = content.length > 100
              ? content.substring(0, 100) + '...'
              : content;

            const conversationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conversations?id=${conversationId}`;

            // Send email to all admins (don't await to avoid blocking)
            admins.forEach(async (admin) => {
              try {
                if (!supabaseAdmin) return;

                // Get user info from auth.users
                const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(
                  admin.user_id
                );

                if (!user || userError) {
                  console.error('Error getting user:', userError);
                  return;
                }

                const email = user.email || '';
                const fullName = user.user_metadata?.full_name as string | undefined;
                const userName = fullName || email.split('@')[0] || 'Usuario';

                const emailTemplate = conversationNotificationEmailTemplate({
                  userName,
                  workspaceName: String(workspace.name),
                  customerName,
                  messagePreview,
                  conversationUrl,
                });

                await resend.emails.send({
                  from: FROM_EMAIL,
                  to: email,
                  subject: emailTemplate.subject,
                  html: emailTemplate.html,
                  text: emailTemplate.text,
                });

                console.log(`✅ Message notification sent to ${email}`);
              } catch (emailError) {
                console.error(`Error sending message notification:`, emailError);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error sending message notification:', error);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: message,
    });
  } catch (error: any) {
    console.error('Error in add message:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
