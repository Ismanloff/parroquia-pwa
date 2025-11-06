'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function WorkspaceSwitcher() {
  const { workspace, workspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {workspace ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
              {workspace.name?.[0]?.toUpperCase() || 'W'}
            </div>
            <span className="font-medium">{workspace.name}</span>
            <ChevronDown className="w-4 h-4" />
          </>
        ) : (
          <span>Seleccionar workspace</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                switchWorkspace(ws.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
                {ws.name?.[0]?.toUpperCase() || 'W'}
              </div>
              <span className="flex-1 text-left">{ws.name}</span>
              {workspace?.id === ws.id && <Check className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <Link
            href="/workspaces/new"
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span>Crear workspace</span>
          </Link>
        </div>
      )}
    </div>
  );
}
