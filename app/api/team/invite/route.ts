import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, FROM_EMAIL } from '@/app/lib/resend';
import { teamInvitationEmailTemplate } from '@/app/lib/email-templates';

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
 * POST /api/team/invite
 * Invita a un nuevo miembro al workspace
 *
 * Body: { email, workspaceId, role }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, workspaceId, role = 'agent', inviterId } = await req.json();

    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: 'email and workspaceId are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'agent', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, agent, or viewer' },
        { status: 400 }
      );
    }

    // Check if workspace exists
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

    // Get inviter information if provided
    let inviterName = 'El equipo de ' + workspace.name;
    if (inviterId) {
      const { data: inviter } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', inviterId)
        .single();

      if (inviter) {
        inviterName = inviter.full_name || inviter.email.split('@')[0];
      }
    }

    // Check if user already exists in Supabase Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    const existingUser = users?.find(u => u.email === email);

    if (existingUser) {
      // User exists, check if already member
      const { data: existingMember } = await supabaseAdmin
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this workspace' },
          { status: 400 }
        );
      }

      // Add user as member
      const { error: insertError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: existingUser.id,
          role: role,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(), // Auto-accept for existing users
        });

      if (insertError) {
        console.error('Error adding member:', insertError);
        return NextResponse.json(
          { error: 'Failed to add member' },
          { status: 500 }
        );
      }

      // Send notification email to existing user
      try {
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?workspace=${workspaceId}`;
        const emailTemplate = teamInvitationEmailTemplate({
          inviterName,
          inviteeName: existingUser.email?.split('@')[0] || 'Usuario',
          workspaceName: workspace.name,
          inviteUrl,
          role,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });

        console.log(`✅ Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: `${email} has been added to the workspace`,
        userExists: true,
      });
    } else {
      // User doesn't exist - create them and send custom invitation email

      // Generate a secure random password (user will set their own on first login)
      const tempPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);

      // Create user account
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false, // They'll confirm via email link
        user_metadata: {
          invited_to_workspace: workspaceId,
          invited_role: role,
        },
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      // Add user to workspace_members
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: newUser.user.id,
          role: role,
          invited_at: new Date().toISOString(),
          // accepted_at will be set when they complete onboarding
        });

      if (memberError) {
        console.error('Error adding workspace member:', memberError);
        // Don't fail - user is created, they can be added later
      }

      // Generate password reset link (doubles as invitation link)
      const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        password: tempPassword,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?workspace=${workspaceId}`,
        },
      });

      if (resetError || !resetData.properties?.action_link) {
        console.error('Error generating signup link:', resetError);
        return NextResponse.json(
          { error: 'Failed to generate invitation link' },
          { status: 500 }
        );
      }

      // Send custom invitation email
      try {
        const emailTemplate = teamInvitationEmailTemplate({
          inviterName,
          inviteeName: email.split('@')[0],
          workspaceName: workspace.name,
          inviteUrl: resetData.properties.action_link,
          role,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });

        console.log(`✅ Invitation email sent to new user ${email}`);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        return NextResponse.json(
          { error: 'User created but failed to send invitation email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${email}`,
        userExists: false,
      });
    }
  } catch (error) {
    console.error('Error in POST /api/team/invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
