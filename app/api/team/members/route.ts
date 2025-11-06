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
 * GET /api/team/members?workspaceId=xxx
 * Lista todos los miembros de un workspace con información del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Get workspace members with user data
    const { data: members, error } = await supabaseAdmin
      .from('workspace_members')
      .select(`
        workspace_id,
        user_id,
        role,
        invited_at,
        accepted_at
      `)
      .eq('workspace_id', workspaceId)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Get user emails from auth.users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create a map of userId -> user data
    const userMap = new Map(
      users?.map(user => [user.id, user]) || []
    );

    // Transform data to include user info
    const transformedMembers = members?.map(member => {
      const user = userMap.get(member.user_id);
      return {
        workspaceId: member.workspace_id,
        userId: member.user_id,
        role: member.role,
        invitedAt: member.invited_at,
        acceptedAt: member.accepted_at,
        email: user?.email || 'Unknown',
        name: user?.user_metadata?.full_name ||
              user?.user_metadata?.name ||
              user?.email?.split('@')[0] ||
              'Unknown',
      };
    }) || [];

    return NextResponse.json({
      success: true,
      members: transformedMembers,
    });
  } catch (error) {
    console.error('Error in GET /api/team/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/members
 * Elimina un miembro del workspace
 */
export async function DELETE(req: NextRequest) {
  try {
    const { workspaceId, userId } = await req.json();

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: 'workspaceId and userId are required' },
        { status: 400 }
      );
    }

    // Check if trying to remove the last owner
    const { data: members } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('role', 'owner');

    if (members && members.length === 1) {
      // Check if we're removing the only owner
      const { data: targetMember } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

      if (targetMember?.role === 'owner') {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the workspace' },
          { status: 400 }
        );
      }
    }

    // Remove member
    const { error } = await supabaseAdmin
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing member:', error);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/team/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/members
 * Actualiza el rol de un miembro
 */
export async function PATCH(req: NextRequest) {
  try {
    const { workspaceId, userId, role } = await req.json();

    if (!workspaceId || !userId || !role) {
      return NextResponse.json(
        { error: 'workspaceId, userId, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'agent', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if trying to change the last owner's role
    if (role !== 'owner') {
      const { data: members } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('role', 'owner');

      if (members && members.length === 1) {
        const { data: targetMember } = await supabaseAdmin
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single();

        if (targetMember?.role === 'owner') {
          return NextResponse.json(
            { error: 'Cannot change the role of the last owner' },
            { status: 400 }
          );
        }
      }
    }

    // Update role
    const { error } = await supabaseAdmin
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating role:', error);
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/team/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
