'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { workspaceService } from '@/lib/services/workspace';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

interface WorkspaceContextValue {
  workspace: Workspace | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const WORKSPACE_STORAGE_KEY = 'resply-active-workspace';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch workspaces del usuario
  const fetchWorkspaces = async () => {
    try {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const userWorkspaces = await workspaceService.getUserWorkspaces(user.id);
      setWorkspaces(userWorkspaces);

      // Leer workspace activo desde localStorage
      const savedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);

      if (savedWorkspaceId) {
        const savedWorkspace = userWorkspaces.find(w => w.id === savedWorkspaceId);
        if (savedWorkspace) {
          setWorkspace(savedWorkspace);
        } else {
          const firstWorkspace = userWorkspaces[0];
          if (firstWorkspace) {
            setWorkspace(firstWorkspace);
            localStorage.setItem(WORKSPACE_STORAGE_KEY, firstWorkspace.id);
          }
        }
      } else {
        const firstWorkspace = userWorkspaces[0];
        if (firstWorkspace) {
          setWorkspace(firstWorkspace);
          localStorage.setItem(WORKSPACE_STORAGE_KEY, firstWorkspace.id);
        }
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar workspaces al montar
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Cambiar workspace activo
  const switchWorkspace = (workspaceId: string) => {
    const newWorkspace = workspaces.find(w => w.id === workspaceId);
    if (newWorkspace) {
      setWorkspace(newWorkspace);
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
      // Recargar página para aplicar cambios
      router.refresh();
    }
  };

  // Refrescar lista de workspaces
  const refreshWorkspaces = async () => {
    await fetchWorkspaces();
  };

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      workspaces,
      activeWorkspaceId: workspace?.id || null,
      isLoading,
      switchWorkspace,
      refreshWorkspaces
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
