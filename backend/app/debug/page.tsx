'use client';

import { useState, useEffect } from 'react';

type LogEntry = {
  id: string;
  type: 'frontend' | 'backend';
  level: 'info' | 'error' | 'warning' | 'debug';
  requestId?: string;
  message: string;
  data?: any;
  timestamp: string;
  serverTimestamp: string;
};

export default function DebugDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'frontend' | 'backend'>('all');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/logger');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (confirm('¿Limpiar todos los logs?')) {
      await fetch('/api/debug/logger', { method: 'DELETE' });
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 2000); // Refrescar cada 2 segundos
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredLogs = logs.filter(log => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    if (!filter) return true;

    const searchText = filter.toLowerCase();
    return (
      log.message?.toLowerCase().includes(searchText) ||
      log.requestId?.toLowerCase().includes(searchText) ||
      JSON.stringify(log.data || {}).toLowerCase().includes(searchText)
    );
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 border-red-300 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'info': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'debug': return 'bg-gray-100 border-gray-300 text-gray-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'frontend' ? 'bg-purple-500' : 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 Debug Dashboard
          </h1>
          <p className="text-gray-600">
            Logs en tiempo real de frontend y backend
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Buscar en logs (requestId, mensaje, data)..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
            </select>

            {/* Auto Refresh */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Auto-refresh (2s)</span>
            </label>

            {/* Refresh Button */}
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? '⏳ Cargando...' : '🔄 Refrescar'}
            </button>

            {/* Clear Button */}
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🗑️ Limpiar
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-4 text-sm">
            <span className="text-gray-600">
              Total: <strong>{logs.length}</strong>
            </span>
            <span className="text-gray-600">
              Filtrados: <strong>{filteredLogs.length}</strong>
            </span>
            <span className="text-gray-600">
              Frontend: <strong>{logs.filter(l => l.type === 'frontend').length}</strong>
            </span>
            <span className="text-gray-600">
              Backend: <strong>{logs.filter(l => l.type === 'backend').length}</strong>
            </span>
          </div>
        </div>

        {/* Logs */}
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No hay logs para mostrar
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`rounded-lg border-2 p-4 ${getLevelColor(log.level)}`}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-2">
                  <span className={`${getTypeColor(log.type)} text-white text-xs font-bold px-2 py-1 rounded`}>
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300">
                    {log.level.toUpperCase()}
                  </span>
                  {log.requestId && (
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300">
                      {log.requestId}
                    </span>
                  )}
                  <span className="text-xs text-gray-600 ml-auto">
                    {new Date(log.serverTimestamp).toLocaleTimeString('es-ES', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3
                    })}
                  </span>
                </div>

                {/* Message */}
                <div className="font-medium mb-2">{log.message}</div>

                {/* Data */}
                {log.data && Object.keys(log.data).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                      📊 Ver datos ({Object.keys(log.data).length} campos)
                    </summary>
                    <pre className="mt-2 p-3 bg-white rounded border border-gray-300 text-xs overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
