import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useCurrentWorkspace() {
  const { workspace, workspaces, isLoading } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    // Redirigir a selector de workspace si no hay workspace activo
    if (!isLoading && !workspace && workspaces.length > 0) {
      router.push('/workspaces');
    }
  }, [workspace, workspaces, isLoading, router]);

  return { workspace, workspaces, isLoading };
}
