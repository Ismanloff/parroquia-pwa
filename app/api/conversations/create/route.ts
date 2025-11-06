import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { resend, FROM_EMAIL } from '@/app/lib/resend';
import { conversationNotificationEmailTemplate } from '@/app/lib/email-templates';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      workspaceId,
      userId,
      channel = 'web',
      metadata = {},
    } = body;

    // Validate inputs
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: 'workspaceId and userId are required' },
        { status: 400 }
      );
    }

    console.log('Creating conversation:', { workspaceId, userId, channel });

    // Create conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        channel: channel,
        status: 'active',
        metadata: metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Conversation created:', conversation.id);

    // Send notification email to workspace owner/admins (async, don't block response)
    try {
      // Get workspace details and owner/admins
      const { data: workspace, error: wsError } = await supabaseAdmin
        .from('workspaces')
        .select('name, created_by')
        .eq('id', workspaceId)
        .single();

      if (workspace && !wsError && 'name' in workspace) {
        // Get admin members
        const { data: admins } = await supabaseAdmin
          .from('workspace_members')
          .select('user_id')
          .eq('workspace_id', workspaceId)
          .in('role', ['admin', 'owner']);

        if (admins && admins.length > 0) {
          // Get customer name from metadata or userId
          const customerName = metadata?.customer_name || metadata?.name || `Usuario ${String(userId).substring(0, 8)}`;
          const conversationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conversations?id=${conversation.id}`;

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
                messagePreview: 'Nueva conversación iniciada',
                conversationUrl,
              });

              await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
              });

              console.log(`✅ Conversation notification sent to ${email}`);
            } catch (emailError) {
              console.error(`Error sending conversation notification:`, emailError);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending conversation notification:', error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      conversation: conversation,
    });
  } catch (error: any) {
    console.error('Error in create conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
