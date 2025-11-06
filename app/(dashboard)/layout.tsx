'use client';

import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { WorkspaceProvider } from '@/lib/contexts/WorkspaceContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';
import { DashboardGuard } from '@/components/dashboard/DashboardGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
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
                {/* TODO: Agregar UserMenu */}
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
    </DashboardGuard>
  );
}
