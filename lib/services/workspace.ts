import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert'];

export const workspaceService = {
  // Obtener workspaces del usuario
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .rpc('get_user_workspaces', { user_uuid: userId });

    if (error) throw error;

    // Fetch complete workspace data
    const workspaceIds = data.map(w => w.workspace_id);
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds);

    if (wsError) throw wsError;
    return workspaces || [];
  },

  // Crear nuevo workspace
  async createWorkspace(data: WorkspaceInsert, userId: string): Promise<Workspace> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    // 1. Crear workspace
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // 2. Agregar usuario como owner
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

    if (memberError) throw memberError;

    // 3. Crear workspace settings por defecto
    const { error: settingsError } = await supabase
      .from('workspace_settings')
      .insert({ workspace_id: workspace.id });

    if (settingsError) throw settingsError;

    return workspace;
  },

  // Verificar permisos
  async hasPermission(userId: string, workspaceId: string, requiredRole: 'owner' | 'admin' | 'member'): Promise<boolean> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .rpc('has_workspace_permission', {
        user_uuid: userId,
        workspace_uuid: workspaceId,
        required_role: requiredRole,
      });

    if (error) throw error;
    return data || false;
  },

  // Invitar usuario
  async inviteMember(_workspaceId: string, _email: string, _role: 'admin' | 'member'): Promise<void> {
    // TODO: Implementar
    // 1. Verificar si el email existe en auth.users
    // 2. Si existe, agregar a workspace_members
    // 3. Si no existe, crear invitación pendiente y enviar email
  },
};
