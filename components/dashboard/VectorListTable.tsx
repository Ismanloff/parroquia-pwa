'use client';

import { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  token_count: number;
  pinecone_id: string;
  created_at: string;
  documents: {
    filename: string;
    mime_type: string;
  };
}

interface VectorListTableProps {
  workspaceId: string;
}

export function VectorListTable({ workspaceId }: VectorListTableProps) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChunks = async () => {
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
      setChunks(data.chunks || []);
    } catch (error) {
      console.error('Error fetching chunks:', error);
      toast.error('Error al cargar chunks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChunks();
  }, [workspaceId]);

  const filteredChunks = chunks.filter((chunk) =>
    chunk.documents.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chunk.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-3 text-slate-600 dark:text-slate-400">
            Cargando vectores...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="p-4">
        <input
          type="text"
          placeholder="Buscar en chunks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
        />
      </Card>

      {/* Table */}
      {filteredChunks.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Chunk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Pinecone ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredChunks.map((chunk) => (
                  <tr
                    key={chunk.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {chunk.documents.filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default" size="sm">
                        #{chunk.chunk_index + 1}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                        {truncateText(chunk.content, 100)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {chunk.token_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {chunk.pinecone_id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No hay vectores disponibles
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sube documentos para ver los vectores aquí
          </p>
        </Card>
      )}

      {/* Total Count */}
      {filteredChunks.length > 0 && (
        <div className="flex justify-between items-center px-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {filteredChunks.length} de {chunks.length} vectores
          </p>
        </div>
      )}
    </div>
  );
}
