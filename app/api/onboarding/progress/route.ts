import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
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

    const { workspaceId, currentStep, completedSteps, skippedSteps, completed } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId es requerido' },
        { status: 400 }
      );
    }

    // Verify user is member of this workspace
    const { data: membership } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este workspace' },
        { status: 403 }
      );
    }

    // Update onboarding progress
    const updateData: any = {
      current_step: currentStep,
      completed_steps: completedSteps || [],
      updated_at: new Date().toISOString(),
    };

    if (skippedSteps) {
      updateData.skipped_steps = skippedSteps;
    }

    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data: progress, error: updateError } = await supabaseAdmin
      .from('onboarding_progress')
      .update(updateData)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating onboarding progress:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar progreso' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        progress,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in onboarding progress endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
