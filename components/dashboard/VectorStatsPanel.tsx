'use client';

import { useEffect, useState } from 'react';
import { Database, FileText, Hash, Layers, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface VectorStats {
  totalVectors: number;
  dimension: number;
  indexName: string;
  namespace: string;
  totalDocuments: number;
  vectorsByDocument: {
    documentId: string;
    filename: string;
    vectorCount: number;
    totalTokens: number;
  }[];
}

interface VectorStatsPanelProps {
  workspaceId: string;
}

export function VectorStatsPanel({ workspaceId }: VectorStatsPanelProps) {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        toast.error('Database not configured');
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No estás autenticado');
        return;
      }

      const response = await fetch(`/api/pinecone/stats?workspaceId=${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [workspaceId]);

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-600 dark:text-slate-400">
            Cargando estadísticas...
          </span>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          No hay estadísticas disponibles
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Vectores</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalVectors.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Documentos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalDocuments}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Dimensión</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.dimension}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Hash className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Index</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {stats.indexName}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Vectors by Document */}
      {stats.vectorsByDocument.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Vectores por Documento
          </h3>
          <div className="space-y-3">
            {stats.vectorsByDocument.map((doc) => (
              <div
                key={doc.documentId}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {doc.totalTokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {doc.vectorCount}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    vectores
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Index Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Información del Índice
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Namespace</p>
            <p className="text-sm font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded">
              {stats.namespace}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Index Name</p>
            <p className="text-sm font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded">
              {stats.indexName}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
