'use client';

import { useState, useCallback } from 'react';
import { FileText, Search, Upload, Download, Trash2, Wifi, WifiOff, RefreshCw, Database, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useRealtimeDocuments } from '@/hooks/useRealtimeDocuments';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { VectorSearchPanel } from '@/components/dashboard/VectorSearchPanel';
import { VectorStatsPanel } from '@/components/dashboard/VectorStatsPanel';
import { VectorListTable } from '@/components/dashboard/VectorListTable';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Use Realtime hook for live updates
  const { documents, isLoading, error, isConnected, uploadingCount, refresh, deleteDocument } =
    useRealtimeDocuments({
      enabled: true,
    });

  const filteredDocuments = documents.filter((doc) =>
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current workspace ID from localStorage
  const getWorkspaceId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resply-active-workspace') || '';
    }
    return '';
  };

  // Upload files to API
  const uploadFiles = async (files: File[]) => {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      toast.error('No workspace selected');
      return;
    }

    setIsUploading(true);

    try {
      if (!supabase) {
        toast.error('Database not configured');
        setIsUploading(false);
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No estás autenticado');
        setIsUploading(false);
        return;
      }

      // Upload each file
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);

        toast.info(`Subiendo ${file.name}...`);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(`Error al subir ${file.name}: ${error.error}`);
          continue;
        }

        await response.json();
        toast.success(`${file.name} subido exitosamente`);
      }

      // Refresh documents list
      refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir archivos');
    } finally {
      setIsUploading(false);
    }
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string | null) => {
    if (!type) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    if (type.includes('pdf')) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (type.includes('word')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    if (type.includes('text')) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
  };

  const workspaceId = getWorkspaceId();

  return (
    <div className="p-6 sm:p-8">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs />

      {/* Header with Real-time Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Documentos & Vectores
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
            {/* Upload Progress Indicator */}
            {uploadingCount > 0 && (
              <Badge variant="warning" size="sm" className="animate-pulse">
                {uploadingCount} uploading...
              </Badge>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Gestiona documentos y búsqueda vectorial con IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh documents"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.pdf,.doc,.docx,.txt';
              input.onchange = (e: any) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  uploadFiles(files as File[]);
                }
              };
              input.click();
            }}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4" />
            Subir Documento
          </Button>
        </div>
      </div>

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
                {error.message}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs System */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos
            </div>
          </TabsTrigger>
          <TabsTrigger value="vectors">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Vectores
            </div>
          </TabsTrigger>
          <TabsTrigger value="search">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Búsqueda IA
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Documents */}
        <TabsContent value="documents">
          {/* Upload Area with Drag & Drop */}
          <div
            {...getRootProps()}
            className={`p-8 mb-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
              isDragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]'
                : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
                isDragActive
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Upload className={`w-8 h-8 ${
                  isDragActive
                    ? 'text-white'
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {isDragActive ? '¡Suelta los archivos aquí!' : 'Arrastra archivos aquí'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                o haz clic para seleccionar archivos
              </p>
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Subiendo archivos...
                  </span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="flex items-center gap-2 mx-auto pointer-events-none"
                >
                  <Upload className="w-4 h-4" />
                  Seleccionar Archivos
                </Button>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Soporta: PDF, DOC, DOCX, TXT (máx. 10MB)
              </p>
            </div>
          </div>

          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </Card>

          {/* Documents List */}
          {isLoading ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">
                  Loading documents...
                </span>
              </div>
            </Card>
          ) : filteredDocuments.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Tamaño
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Chunks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Subido
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIcon(doc.mime_type)}`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {doc.filename}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {doc.mime_type || 'Unknown type'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {formatFileSize(doc.file_size)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {doc.chunk_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              doc.status === 'completed'
                                ? 'success'
                                : doc.status === 'processing'
                                ? 'warning'
                                : doc.status === 'error'
                                ? 'error'
                                : 'default'
                            }
                            size="sm"
                          >
                            {doc.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('es-ES') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              onClick={() => window.open(doc.file_url, '_blank')}
                              title="Download document"
                            >
                              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              onClick={() => {
                                if (confirm(`Delete "${doc.filename}"?`)) {
                                  deleteDocument(doc.id);
                                }
                              }}
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8">
              <EmptyState
                icon={FileText}
                title="No se encontraron documentos"
                description="Intenta con otro término de búsqueda o sube un nuevo documento"
                action={
                  <Button
                    variant="primary"
                    className="flex items-center gap-2"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.pdf,.doc,.docx,.txt';
                      input.onchange = (e: any) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          uploadFiles(files as File[]);
                        }
                      };
                      input.click();
                    }}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4" />
                    Subir Documento
                  </Button>
                }
              />
            </Card>
          )}

          {/* Stats Footer */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Documentos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {documents.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Chunks</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tamaño Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatFileSize(documents.reduce((acc, d) => acc + (d.file_size || 0), 0))}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completados</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {documents.filter((d) => d.status === 'completed').length}
              </p>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Vectors */}
        <TabsContent value="vectors">
          <VectorStatsPanel workspaceId={workspaceId} />
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Lista de Vectores
            </h2>
            <VectorListTable workspaceId={workspaceId} />
          </div>
        </TabsContent>

        {/* Tab 3: Search */}
        <TabsContent value="search">
          <VectorSearchPanel workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
