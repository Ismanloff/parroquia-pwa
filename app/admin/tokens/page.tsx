'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Chrome,
  Database,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface Token {
  id: number;
  tokenPreview: string;
  platform: string;
  browser?: string;
  os?: string;
  userAgent: string;
  createdAt: string;
  lastUsed: string;
  daysSinceLastUse: number | null;
}

export default function TokensAdminPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/tokens');
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
      } else {
        setMessage({ type: 'error', text: 'Error al cargar tokens' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const deleteToken = async (tokenId: number) => {
    if (!confirm('¿Estás seguro de eliminar este token?')) return;

    try {
      setIsDeleting(true);
      const response = await fetch('/api/notifications/tokens', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Token eliminado exitosamente' });
        fetchTokens();
      } else {
        setMessage({ type: 'error', text: 'Error al eliminar token' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteInvalidTokens = async () => {
    if (!confirm('¿Verificar y eliminar tokens inválidos? Esto puede tomar unos segundos.')) return;

    try {
      setIsDeleting(true);
      setMessage({ type: 'info', text: 'Verificando tokens... Esto puede tomar unos segundos' });

      const response = await fetch('/api/notifications/tokens', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteInvalid: true }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `${data.deleted} tokens inválidos eliminados de ${data.total} totales`,
        });
        fetchTokens();
      } else {
        setMessage({ type: 'error', text: 'Error al verificar tokens' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'iOS':
        return '📱';
      case 'Android':
        return '🤖';
      case 'macOS':
        return '💻';
      case 'Windows':
        return '🖥️';
      default:
        return '❓';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'iOS':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Android':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'macOS':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Windows':
        return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const getLastUsedColor = (days: number | null) => {
    if (days === null) return 'text-gray-500';
    if (days === 0) return 'text-green-600 dark:text-green-400';
    if (days <= 7) return 'text-blue-600 dark:text-blue-400';
    if (days <= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLastUsedText = (days: number | null) => {
    if (days === null) return 'Nunca';
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days <= 7) return `Hace ${days} días`;
    if (days <= 30) return `Hace ${days} días`;
    return `Hace ${days} días (inactivo)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel de notificaciones
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Gestión de Tokens FCM
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {tokens.length} dispositivos registrados
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchTokens}
                disabled={isLoading || isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>

              <button
                onClick={deleteInvalidTokens}
                disabled={isLoading || isDeleting || tokens.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar tokens inválidos
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : message.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : message.type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success'
                  ? 'text-green-900 dark:text-green-100'
                  : message.type === 'error'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-blue-900 dark:text-blue-100'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {/* Tokens List */}
        {!isLoading && tokens.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-12 text-center">
            <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No hay tokens registrados
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Los usuarios deben activar las notificaciones primero
            </p>
          </div>
        )}

        {!isLoading && tokens.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{getPlatformIcon(token.platform)}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {token.os || token.platform}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getPlatformColor(token.platform)}`}
                          >
                            {token.platform}
                          </span>
                        </div>
                        {token.browser && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Chrome className="w-3 h-3" />
                            {token.browser}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 dark:text-slate-400 min-w-[100px]">
                          Token:
                        </span>
                        <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-100">
                          {token.tokenPreview}
                        </code>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400">Último uso:</span>
                        <span className={`font-medium ${getLastUsedColor(token.daysSinceLastUse)}`}>
                          {getLastUsedText(token.daysSinceLastUse)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 dark:text-slate-400 min-w-[100px]">
                          User Agent:
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 break-all">
                          {token.userAgent}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Registrado:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(token.createdAt).toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteToken(token.id)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Información sobre tokens
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                Los tokens FCM son únicos por dispositivo y se generan al activar notificaciones
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                Los tokens pueden invalidarse si el usuario desinstala la PWA o revoca permisos
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <span>
                Tokens inactivos por más de 30 días pueden ser inválidos y deben eliminarse
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <span>
                El botón &quot;Limpiar tokens inválidos&quot; verifica cada token con Firebase y
                elimina los que ya no funcionan
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
