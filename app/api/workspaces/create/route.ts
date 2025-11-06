import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import type { Database } from '@/types/database';

type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];

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

    // Parse request body
    const body = await req.json();
    const { name, slug, pinecone_namespace } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nombre y slug son requeridos' },
        { status: 400 }
      );
    }

    console.log('[API] Creating workspace:', { name, slug, pinecone_namespace, userId: user.id });

    // Step 1: Create workspace using admin client (bypasses RLS)
    const workspaceData: WorkspaceInsert = {
      name,
      slug,
      pinecone_namespace: pinecone_namespace || null,
    };

    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .insert(workspaceData)
      .select()
      .single();

    if (workspaceError) {
      console.error('[API] Error creating workspace:', workspaceError);
      return NextResponse.json(
        { error: `Error al crear workspace: ${workspaceError.message}` },
        { status: 500 }
      );
    }

    console.log('[API] Workspace created:', workspace);

    // Step 2: Add user as owner in workspace_members
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('[API] Error adding member:', memberError);
      // Rollback: delete workspace
      await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json(
        { error: `Error al agregar usuario al workspace: ${memberError.message}` },
        { status: 500 }
      );
    }

    console.log('[API] Member added successfully');

    // Step 3: Create workspace settings
    const { error: settingsError } = await supabaseAdmin
      .from('workspace_settings')
      .insert({ workspace_id: workspace.id });

    if (settingsError) {
      console.error('[API] Error creating settings:', settingsError);
      // Rollback: delete member and workspace
      await supabaseAdmin.from('workspace_members').delete().eq('workspace_id', workspace.id);
      await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
      return NextResponse.json(
        { error: `Error al crear configuración del workspace: ${settingsError.message}` },
        { status: 500 }
      );
    }

    console.log('[API] Settings created successfully');
    console.log('[API] Workspace creation completed:', workspace);

    return NextResponse.json(
      {
        workspace,
        message: 'Workspace creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Error in workspace creation endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
