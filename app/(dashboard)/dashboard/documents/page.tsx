'use client';

import { useState } from 'react';
import { FileText, Plus, Search, Upload, Download, Trash2, MoreVertical, File, Folder } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

// Mock data - en producción vendría de Supabase
const mockDocuments = [
  {
    id: '1',
    workspace_id: '1',
    workspace_name: 'Acme Corporation',
    name: 'Manual de Liturgia.pdf',
    type: 'application/pdf',
    size: 2456789,
    uploaded_at: '2025-01-20T10:30:00Z',
    uploaded_by: 'admin@acme.com',
    chunks_count: 145,
    status: 'processed',
  },
  {
    id: '2',
    workspace_id: '2',
    workspace_name: 'TechStart Inc',
    name: 'Catecismo Resumido.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1234567,
    uploaded_at: '2025-01-19T14:20:00Z',
    uploaded_by: 'sarah@techstart.com',
    chunks_count: 87,
    status: 'processed',
  },
  {
    id: '3',
    workspace_id: '1',
    workspace_name: 'Acme Corporation',
    name: 'Horarios de Atención.txt',
    type: 'text/plain',
    size: 12345,
    uploaded_at: '2025-01-19T09:15:00Z',
    uploaded_by: 'admin@acme.com',
    chunks_count: 5,
    status: 'processed',
  },
  {
    id: '4',
    workspace_id: '3',
    workspace_name: 'Global Solutions',
    name: 'Historia de la Empresa.pdf',
    type: 'application/pdf',
    size: 3456789,
    uploaded_at: '2025-01-18T16:45:00Z',
    uploaded_by: 'anna@global.com',
    chunks_count: 203,
    status: 'processed',
  },
  {
    id: '5',
    workspace_id: '2',
    workspace_name: 'TechStart Inc',
    name: 'Guía de Productos.pdf',
    type: 'application/pdf',
    size: 1876543,
    uploaded_at: '2025-01-18T11:30:00Z',
    uploaded_by: 'david@techstart.com',
    chunks_count: 112,
    status: 'processing',
  },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents] = useState(mockDocuments);

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.workspace_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (type.includes('word')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    if (type.includes('text')) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Documentos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestiona todos los documentos del sistema
          </p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Subir Documento
        </Button>
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

      {/* Upload Area */}
      <Card className="p-8 mb-6 border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Arrastra archivos aquí
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            o haz clic para seleccionar archivos
          </p>
          <Button variant="primary" className="flex items-center gap-2 mx-auto">
            <Upload className="w-4 h-4" />
            Seleccionar Archivos
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            Soporta: PDF, DOCX, TXT, MD (máx. 10MB)
          </p>
        </div>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Workspace
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
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIcon(doc.type)}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {doc.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {doc.uploaded_by}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {doc.workspace_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formatFileSize(doc.size)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {doc.chunks_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={doc.status === 'processed' ? 'success' : 'info'}
                        size="sm"
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
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
              <Button variant="primary" className="flex items-center gap-2">
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
            {documents.reduce((acc, d) => acc + d.chunks_count, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tamaño Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatFileSize(documents.reduce((acc, d) => acc + d.size, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Procesados</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {documents.filter((d) => d.status === 'processed').length}
          </p>
        </Card>
      </div>
    </div>
  );
}
