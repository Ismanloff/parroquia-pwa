import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'edge';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

// Helper function to ensure unique slug
async function generateUniqueSlug(baseName: string): Promise<string> {
  if (!supabaseAdmin) throw new Error('Supabase admin not configured');

  let slug = generateSlug(baseName);
  let counter = 1;

  // Check if slug exists, if so add counter
  while (true) {
    const { data } = await supabaseAdmin
      .from('workspaces')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (!data) break; // Slug is available

    slug = `${generateSlug(baseName)}-${counter}`;
    counter++;
  }

  return slug;
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    const { email, password, name } = await req.json();

    // Validations
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Step 1: Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for better UX
      user_metadata: {
        full_name: name || '',
      },
    });

    if (authError) {
      console.error('Error creating user:', authError);

      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: authError.message || 'Error al crear usuario' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Generate unique slug for workspace
    const workspaceName = name || email.split('@')[0];
    const slug = await generateUniqueSlug(workspaceName);

    // Step 3: Create workspace with 14-day PRO trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days from now

    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name: workspaceName,
        slug,
        plan: 'free', // Will be 'free' after trial
        billing_status: 'trialing', // Trial status
        trial_ends_at: trialEndsAt.toISOString(),
        // pinecone_namespace will be set below using workspace.id for guaranteed uniqueness
      } as any)
      .select()
      .single();

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);

      // Rollback: Delete the created user
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: 'Error al crear workspace' },
        { status: 500 }
      );
    }

    // Step 3.5: Update workspace with pinecone_namespace based on workspace.id (100% unique)
    const pineconeNamespace = `ws_${(workspace as any).id.replace(/-/g, '')}`;
    const { error: namespaceError } = await supabaseAdmin
      .from('workspaces')
      .update({ pinecone_namespace: pineconeNamespace } as any)
      .eq('id', (workspace as any).id);

    if (namespaceError) {
      console.error('Error setting pinecone namespace:', namespaceError);

      // Rollback: Delete workspace and user
      await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: 'Error al configurar workspace' },
        { status: 500 }
      );
    }

    // Step 4: Create workspace member (owner)
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Error creating workspace member:', memberError);

      // Rollback: Delete workspace and user
      await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: 'Error al asignar permisos' },
        { status: 500 }
      );
    }

    // Step 5: Create initial workspace settings
    await supabaseAdmin
      .from('workspace_settings')
      .insert({
        workspace_id: workspace.id,
        chatbot_name: 'Asistente',
        welcome_message: '¡Hola! ¿En qué puedo ayudarte?',
        language: 'es',
        tone: 'friendly',
      });

    // Step 6: Create onboarding progress
    await supabaseAdmin
      .from('onboarding_progress')
      .insert({
        workspace_id: workspace.id,
        current_step: 1,
        completed_steps: [],
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Cuenta creada exitosamente. ¡Bienvenido a tu prueba gratuita de 14 días!',
        userId,
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        trialEndsAt: trialEndsAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in register-with-workspace endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
