'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import ChatInterface from '@/components/chat/ChatInterface';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const { activeWorkspaceId, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!activeWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Workspace Selected
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please select or create a workspace to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat con IA</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Pregunta cualquier cosa sobre tus documentos
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatInterface workspaceId={activeWorkspaceId} />
      </div>
    </div>
  );
}
