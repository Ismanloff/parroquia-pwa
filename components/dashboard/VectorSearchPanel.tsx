'use client';

import { useState } from 'react';
import { Search, RefreshCw, FileText, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  score: number;
  documentId: string;
  filename: string;
  text: string;
  chunkIndex: number;
}

interface VectorSearchPanelProps {
  workspaceId: string;
}

export function VectorSearchPanel({ workspaceId }: VectorSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Por favor ingresa una consulta');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      if (!supabase) {
        toast.error('Database not configured');
        setIsSearching(false);
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No estás autenticado');
        return;
      }

      const response = await fetch('/api/pinecone/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query,
          workspaceId,
          topK: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const data = await response.json();
      setResults(data.results);

      if (data.results.length === 0) {
        toast.info('No se encontraron resultados');
      } else {
        toast.success(`Se encontraron ${data.results.length} resultados`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error al realizar la búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Búsqueda Semántica en Vectores
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Busca en todos los documentos vectorizados usando búsqueda semántica con IA
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Ej: ¿Cuáles son los horarios de atención?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white disabled:opacity-50"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="flex items-center gap-2 px-6"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Buscar
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Intenta con otros términos de búsqueda o sube más documentos
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </h3>
                <Badge variant="default" size="sm">
                  Query: "{query}"
                </Badge>
              </div>

              {results.map((result, index) => (
                <Card key={result.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {result.filename}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>Chunk #{result.chunkIndex + 1}</span>
                          <span>•</span>
                          <span>Resultado #{index + 1}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getScoreBadge(result.score)} size="sm">
                      {(result.score * 100).toFixed(0)}% match
                    </Badge>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {result.text}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Similarity score:</span>
                    <span className={`font-semibold ${getScoreColor(result.score)}`}>
                      {result.score.toFixed(4)}
                    </span>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Búsqueda Semántica con IA
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Usa búsqueda vectorial para encontrar información relevante en tus documentos.
            No necesitas palabras exactas, la IA entiende el contexto de tu pregunta.
          </p>
        </Card>
      )}
    </div>
  );
}
