'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export default function WorkspacesPage() {
  const { workspaces, workspace, switchWorkspace } = useWorkspace();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Workspaces</h1>
        <Link
          href="/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Crear workspace
        </Link>
      </div>

      <div className="grid gap-4">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {ws.name?.[0]?.toUpperCase() || 'W'}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{ws.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">/{ws.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => switchWorkspace(ws.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {workspace?.id === ws.id ? 'Activo' : 'Seleccionar'}
                </button>
                <Link
                  href={`/workspaces/${ws.id}/settings`}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
