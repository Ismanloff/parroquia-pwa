'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { WorkspaceProvider } from '@/lib/contexts/WorkspaceContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { UserMenu } from '@/components/layout/UserMenu';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <WorkspaceSwitcher />
              </div>
              <UserMenu />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>

        <Toaster position="top-right" richColors />
      </div>
    </WorkspaceProvider>
  );
}
