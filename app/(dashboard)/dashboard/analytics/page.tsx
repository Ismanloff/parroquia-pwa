'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, MessageSquare, Users, FileText, Clock, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Mock data - en producción vendría de la API
const weeklyData = [
  { day: 'Lun', conversations: 45, messages: 234, documents: 12 },
  { day: 'Mar', conversations: 52, messages: 287, documents: 8 },
  { day: 'Mié', conversations: 48, messages: 256, documents: 15 },
  { day: 'Jue', conversations: 61, messages: 312, documents: 10 },
  { day: 'Vie', conversations: 55, messages: 298, documents: 18 },
  { day: 'Sáb', conversations: 38, messages: 189, documents: 5 },
  { day: 'Dom', conversations: 42, messages: 215, documents: 7 },
];

const topWorkspaces = [
  { name: 'Global Solutions', conversations: 234, growth: 12.5 },
  { name: 'Acme Corporation', conversations: 189, growth: 8.3 },
  { name: 'TechStart Inc', conversations: 156, growth: -2.1 },
  { name: 'Innovation Hub', conversations: 134, growth: 15.7 },
  { name: 'Digital Partners', conversations: 98, growth: 5.2 },
];

const responseTimeData = [
  { hour: '00:00', avgTime: 45 },
  { hour: '04:00', avgTime: 38 },
  { hour: '08:00', avgTime: 52 },
  { hour: '12:00', avgTime: 67 },
  { hour: '16:00', avgTime: 58 },
  { hour: '20:00', avgTime: 43 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const maxConversations = Math.max(...weeklyData.map((d) => d.conversations));
  const maxMessages = Math.max(...weeklyData.map((d) => d.messages));

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análisis y métricas del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              timeRange === '7d'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            7 días
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              timeRange === '30d'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            30 días
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              timeRange === '90d'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            90 días
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="success" size="sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              12.3%
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Conversaciones</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">1,234</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            vs. período anterior
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="success" size="sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              8.7%
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Usuarios Activos</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">342</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            vs. período anterior
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge variant="success" size="sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              5.2%
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Documentos</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">856</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            vs. período anterior
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <Badge variant="error" size="sm">
              <TrendingDown className="w-3 h-3 mr-1" />
              3.1%
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tiempo Respuesta</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">52s</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            promedio esta semana
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Conversaciones por Día */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Conversaciones por Día
          </h2>
          <div className="space-y-4">
            {weeklyData.map((data) => (
              <div key={data.day}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {data.day}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {data.conversations}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full transition-all"
                    style={{ width: `${(data.conversations / maxConversations) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mensajes por Día */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Mensajes por Día
          </h2>
          <div className="space-y-4">
            {weeklyData.map((data) => (
              <div key={data.day}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {data.day}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {data.messages}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-emerald-700 rounded-full transition-all"
                    style={{ width: `${(data.messages / maxMessages) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Workspaces and Response Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Workspaces */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Top Workspaces
          </h2>
          <div className="space-y-4">
            {topWorkspaces.map((workspace, index) => (
              <div
                key={workspace.name}
                className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-400">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {workspace.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {workspace.conversations} conversaciones
                  </p>
                </div>
                <Badge
                  variant={workspace.growth > 0 ? 'success' : 'error'}
                  size="sm"
                >
                  {workspace.growth > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(workspace.growth)}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Response Time by Hour */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Tiempo de Respuesta por Hora
          </h2>
          <div className="space-y-4">
            {responseTimeData.map((data) => (
              <div key={data.hour}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {data.hour}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {data.avgTime}s
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-red-700 rounded-full transition-all"
                    style={{ width: `${(data.avgTime / 70) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
          Actividad Semanal
        </h2>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-2">
            {weeklyData.map((data) => (
              <div key={data.day} className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{data.day}</p>
                <div className="flex flex-col gap-2">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{
                      backgroundColor: `rgba(37, 99, 235, ${data.conversations / maxConversations})`,
                    }}
                  >
                    {data.conversations}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {data.documents} docs
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
