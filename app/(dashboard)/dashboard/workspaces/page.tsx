'use client';

import { useState } from 'react';
import { Building2, Plus, Search, MoreVertical, Users, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

// Mock data - en producción vendría de Supabase
const mockWorkspaces = [
  {
    id: '1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    created_at: '2025-01-15T10:00:00Z',
    members_count: 12,
    conversations_count: 45,
    status: 'active',
  },
  {
    id: '2',
    name: 'TechStart Inc',
    slug: 'techstart',
    created_at: '2025-01-10T14:30:00Z',
    members_count: 8,
    conversations_count: 23,
    status: 'active',
  },
  {
    id: '3',
    name: 'Global Solutions',
    slug: 'global-solutions',
    created_at: '2025-01-05T09:15:00Z',
    members_count: 25,
    conversations_count: 89,
    status: 'active',
  },
];

export default function WorkspacesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaces] = useState(mockWorkspaces);

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Workspaces
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestiona todos los workspaces del sistema
          </p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Workspace
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>
      </Card>

      {/* Workspaces Table */}
      {filteredWorkspaces.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Miembros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Conversaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredWorkspaces.map((workspace) => (
                  <tr
                    key={workspace.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {workspace.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {workspace.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        {workspace.members_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <MessageSquare className="w-4 h-4" />
                        {workspace.conversations_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="success" size="sm">
                        {workspace.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(workspace.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <EmptyState
            icon={Building2}
            title="No se encontraron workspaces"
            description="Intenta con otro término de búsqueda o crea un nuevo workspace"
            action={
              <Button variant="primary" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Crear Workspace
              </Button>
            }
          />
        </Card>
      )}

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Workspaces</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{workspaces.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Miembros</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {workspaces.reduce((acc, w) => acc + w.members_count, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Conversaciones</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {workspaces.reduce((acc, w) => acc + w.conversations_count, 0)}
          </p>
        </Card>
      </div>
    </div>
  );
}
