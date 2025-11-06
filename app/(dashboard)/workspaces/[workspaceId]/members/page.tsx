'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, UserPlus, Trash2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'] & {
  user_email?: string;
  user_name?: string;
};

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    if (!supabase || !workspaceId) return;

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // TODO: Join con auth.users para obtener email y nombre
      // Por ahora solo mostramos user_id
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !workspaceId || !inviteEmail) return;

    setIsInviting(true);

    try {
      // TODO: Implementar lógica completa de invitación
      // 1. Verificar si email existe en auth.users
      // 2. Si existe, agregar a workspace_members
      // 3. Si no existe, crear invitación pendiente y enviar email

      // Por ahora, solo agregamos directamente (requiere que el usuario exista)
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users?.find(u => u.email === inviteEmail);

      if (!user) {
        alert('Usuario no encontrado. Debe registrarse primero.');
        return;
      }

      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: inviteRole,
          accepted_at: new Date().toISOString(),
        });

      if (error) throw error;

      setInviteEmail('');
      setInviteRole('agent');
      fetchMembers();
      alert('Miembro agregado exitosamente');
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Error al invitar miembro');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!supabase || !workspaceId) return;
    if (!confirm('¿Eliminar este miembro del workspace?')) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;
      fetchMembers();
      alert('Miembro eliminado');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error al eliminar miembro');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!supabase || !workspaceId) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;
      fetchMembers();
      alert('Rol actualizado');
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Error al cambiar rol');
    }
  };

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Miembros del Workspace</h1>

      {/* Formulario de invitación */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invitar Miembro
        </h2>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rol</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'agent')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="agent">Agente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isInviting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {isInviting ? 'Invitando...' : 'Invitar'}
          </button>
        </form>
      </div>

      {/* Lista de miembros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold">Miembros Actuales ({members.length})</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => (
            <div key={member.user_id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{member.user_email || member.user_id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {member.accepted_at ? 'Aceptado' : 'Pendiente'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="viewer">Viewer</option>
                </select>

                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No hay miembros en este workspace
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
