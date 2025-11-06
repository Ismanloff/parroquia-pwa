'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
  invitedAt: string;
  acceptedAt: string | null;
  email: string;
  name: string;
}

export default function TeamPage() {
  const { activeWorkspaceId, workspace } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent' | 'viewer'>('agent');
  const [isInviting, setIsInviting] = useState(false);

  // Fetch members
  useEffect(() => {
    if (activeWorkspaceId) {
      fetchMembers();
    }
  }, [activeWorkspaceId]);

  const fetchMembers = async () => {
    if (!activeWorkspaceId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/team/members?workspaceId=${activeWorkspaceId}`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.members);
      } else {
        toast.error('Error al cargar miembros');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Error al cargar miembros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !activeWorkspaceId) return;

    try {
      setIsInviting(true);
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          workspaceId: activeWorkspaceId,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsInviteModalOpen(false);
        setInviteEmail('');
        setInviteRole('agent');
        fetchMembers();
      } else {
        toast.error(data.error || 'Error al enviar invitación');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Error al enviar invitación');
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!activeWorkspaceId) return;

    try {
      const response = await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          userId,
          role: newRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Rol actualizado');
        fetchMembers();
      } else {
        toast.error(data.error || 'Error al cambiar rol');
      }
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Error al cambiar rol');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!activeWorkspaceId) return;

    if (!confirm(`¿Eliminar a ${userName} del equipo?`)) return;

    try {
      const response = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Miembro eliminado');
        fetchMembers();
      } else {
        toast.error(data.error || 'Error al eliminar miembro');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Error al eliminar miembro');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'agent':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'viewer':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'admin':
        return 'Administrador';
      case 'agent':
        return 'Agente';
      case 'viewer':
        return 'Visor';
      default:
        return role;
    }
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-400">Selecciona un workspace</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Equipo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona los miembros de tu workspace "{workspace?.name}"
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Invitar Miembro
        </button>
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            Cargando...
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            No hay miembros en este workspace
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <div
                key={member.userId}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {member.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {member.role !== 'owner' && (
                    <>
                      {/* Change Role */}
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.userId, e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="admin">Administrador</option>
                        <option value="agent">Agente</option>
                        <option value="viewer">Visor</option>
                      </select>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar miembro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role descriptions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Roles y Permisos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>Propietario:</strong> Control total del workspace
          </div>
          <div>
            <strong>Administrador:</strong> Gestión de equipo y configuración
          </div>
          <div>
            <strong>Agente:</strong> Responder conversaciones y ver documentos
          </div>
          <div>
            <strong>Visor:</strong> Solo lectura de conversaciones
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Invitar Miembro
            </h2>

            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="admin">Administrador</option>
                    <option value="agent">Agente</option>
                    <option value="viewer">Visor</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInviting ? 'Invitando...' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
