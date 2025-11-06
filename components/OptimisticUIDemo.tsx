/**
 * Optimistic UI Demo Component
 * Demonstrates TanStack Query v5 optimistic updates in action
 *
 * Shows:
 * - Instant UI feedback (no loading spinners)
 * - Automatic rollback on error
 * - Toast notifications
 * - State management across components
 */

'use client';

import { useState } from 'react';
import { FileText, Trash2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useOptimisticDocuments } from '@/hooks/useOptimisticDocuments';

export function OptimisticUIDemo() {
  const { documents, isLoading, isDeleting, deleteDocument } = useOptimisticDocuments();
  const [showDemo, setShowDemo] = useState(true);

  if (!showDemo) return null;

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Optimistic UI Demo
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Los cambios aparecen instantáneamente sin spinners
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDemo(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          Cómo funciona:
        </h4>
        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">1.</span>
            <span>
              <strong>Actualización instantánea:</strong> La UI se actualiza inmediatamente cuando
              eliminas un documento (sin esperar al servidor)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">2.</span>
            <span>
              <strong>Rollback automático:</strong> Si el servidor falla, los cambios se revierten
              automáticamente
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">3.</span>
            <span>
              <strong>Sincronización:</strong> Después de cada operación, se sincroniza con el
              servidor para garantizar consistencia
            </span>
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
          Documentos de prueba ({documents.length}):
        </p>

        {isLoading ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">Cargando...</div>
        ) : documents.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No hay documentos. Los cambios aparecerán aquí instantáneamente.
          </div>
        ) : (
          documents.slice(0, 3).map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {doc.mime_type || 'Unknown'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteDocument(doc.id)}
                className="flex items-center gap-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-3 h-3" />
                Eliminar
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Badge variant={isDeleting ? 'warning' : 'success'} size="sm">
            {isDeleting ? 'Procesando...' : 'Listo'}
          </Badge>
          <span>
            {isDeleting
              ? 'Operación en curso (UI ya actualizada)'
              : 'Todas las operaciones sincronizadas'}
          </span>
        </div>
      </div>
    </Card>
  );
}
