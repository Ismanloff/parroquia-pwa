'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Search, MoreVertical, User, Calendar, ExternalLink, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useConversations } from '@/hooks/useConversations';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'closed'>('all');
  const { activeWorkspaceId } = useWorkspace();

  // Use hook for conversations
  const { conversations, isLoading, error, refresh } = useConversations(activeWorkspaceId);
  const isConnected = true; // For now, always show as connected

  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch = searchQuery.length === 0 ||
      (conv.user_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (conv.channel?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs />

      {/* Header with Real-time Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Conversaciones
            </h1>
            {/* Real-time Connection Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Live
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">
                    Offline
                  </span>
                </>
              )}
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Monitorea todas las conversaciones en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh conversations"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Conversación
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por workspace, usuario o mensaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'open'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Abiertas
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'resolved'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Resueltas
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                statusFilter === 'closed'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Cerradas
            </button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                Connection Error
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Conversations List */}
      {isLoading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Loading conversations...
            </span>
          </div>
        </Card>
      ) : filteredConversations.length > 0 ? (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {conversation.workspace_name}
                        </h3>
                        <Badge
                          variant={
                            conversation.status === 'open' || conversation.status === 'assigned'
                              ? 'success'
                              : conversation.status === 'resolved'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {conversation.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {conversation.user_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(conversation.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last Message */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                    {conversation.last_message}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {conversation.messages_count} mensajes
                    </span>
                    <span>
                      Creada {new Date(conversation.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <EmptyState
            icon={MessageSquare}
            title="No se encontraron conversaciones"
            description="Intenta con otro término de búsqueda o filtro"
            action={
              <Button variant="primary" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Conversación
              </Button>
            }
          />
        </Card>
      )}

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {conversations.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Abiertas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {conversations.filter((c) => c.status === 'open' || c.status === 'assigned').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Cerradas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {conversations.filter((c) => c.status === 'closed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Mensajes</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {conversations.reduce((acc, c) => acc + (c.messages_count || 0), 0)}
          </p>
        </Card>
      </div>
    </div>
  );
}
