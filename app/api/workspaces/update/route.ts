import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'edge';

export async function PATCH(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { workspaceId, name } = await req.json();

    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: 'workspaceId y name son requeridos' },
        { status: 400 }
      );
    }

    // Verify user is owner of this workspace
    const { data: membership } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este workspace' },
        { status: 403 }
      );
    }

    // Update workspace
    const { data: workspace, error: updateError } = await supabaseAdmin
      .from('workspaces')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating workspace:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        workspace,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in update workspace endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
