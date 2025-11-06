'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { TrendingUp, MessageSquare, Users, FileText, Clock, Lightbulb, AlertTriangle, Target, Sparkles, ArrowRight, CheckCircle2, Bot, Activity } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { toast } from 'sonner';

interface AnalyticsStats {
  totalConversations: number;
  totalMessages: number;
  aiMessages: number;
  activeConversations: number;
  totalDocuments: number;
  teamMembers: number;
  avgResponseTimeSeconds: number;
  messagesByDay: { [key: string]: number };
  eventsSummary: { [key: string]: number };
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-slate-600 dark:text-slate-400">
            <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchAnalytics();
    }
  }, [activeWorkspaceId, timeRange]);

  const fetchAnalytics = async () => {
    if (!activeWorkspaceId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/overview?workspaceId=${activeWorkspaceId}&period=${timeRange}`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error('Error al cargar analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error al cargar analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Transform messagesByDay into chart data
  const getChartData = () => {
    if (!stats) return [];

    return Object.entries(stats.messagesByDay)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({
        day: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
        messages: count,
        date,
      }));
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600 dark:text-slate-400">Selecciona un workspace</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs customLabels={{ analytics: 'Analíticas' }} />

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
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              timeRange === '24h'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            24 horas
          </button>
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
      {isLoading ? (
        <div className="flex items-center justify-center h-64 mb-8">
          <div className="text-slate-600 dark:text-slate-400">Cargando analytics...</div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Conversaciones</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalConversations}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {stats.activeConversations} activas
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Mensajes</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalMessages}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {stats.aiMessages} por IA
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Documentos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalDocuments}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Base de conocimiento
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tiempo Respuesta</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatResponseTime(stats.avgResponseTimeSeconds)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                promedio
              </p>
            </Card>
          </div>

      {/* Actionable Insights - AI-Powered Recommendations */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recomendaciones Inteligentes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Insights accionables basados en tus datos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Insight 1: Peak Performance Day */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Jueves es tu día pico
                  </h3>
                  <Badge variant="success" size="sm">Alta prioridad</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Las conversaciones aumentan <strong>27% los jueves</strong>. Considera asignar más recursos este día para mantener tiempos de respuesta óptimos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                Ver análisis completo <ArrowRight className="w-3 h-3" />
              </button>
              <button className="ml-auto text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Marcar como visto
              </button>
            </div>
          </div>

          {/* Insight 2: Response Time Alert */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-amber-200 dark:border-amber-800/50 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Tiempos de respuesta en aumento
                  </h3>
                  <Badge variant="warning" size="sm">Media prioridad</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  El tiempo promedio de respuesta aumentó <strong>18% vs. semana pasada</strong>. Revisa la carga de trabajo del equipo o considera automatizar respuestas frecuentes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                Ver detalles <ArrowRight className="w-3 h-3" />
              </button>
              <button className="ml-auto text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Marcar como visto
              </button>
            </div>
          </div>

          {/* Insight 3: Knowledge Base Opportunity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Oportunidad de optimización
                  </h3>
                  <Badge variant="info" size="sm">Recomendación</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  El <strong>35% de las consultas</strong> son sobre horarios de atención. Agrega esta información a tu knowledge base para respuestas automáticas instantáneas.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                Crear documento <ArrowRight className="w-3 h-3" />
              </button>
              <button className="ml-auto text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Marcar como visto
              </button>
            </div>
          </div>

          {/* Insight 4: Growth Trend */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Crecimiento sostenido
                  </h3>
                  <Badge variant="success" size="sm">Buenas noticias</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Las conversaciones crecieron <strong>12.3% este mes</strong>. Tu estrategia de customer engagement está funcionando. Mantén el rumbo y considera escalar el equipo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                Ver tendencias <ArrowRight className="w-3 h-3" />
              </button>
              <button className="ml-auto text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Marcar como visto
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-white">4 recomendaciones activas</span> • Última actualización: hace 2 minutos
          </div>
          <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Ver todas las recomendaciones →
          </button>
        </div>
      </Card>

          {/* Charts with Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Mensajes por Día - Line Chart */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Mensajes por Día
              </h2>
              {getChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Mensajes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No hay datos de mensajes
                </div>
              )}
            </Card>

            {/* Stats Summary Card */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Resumen de Actividad
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Uso de IA
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {stats.totalMessages > 0
                        ? Math.round((stats.aiMessages / stats.totalMessages) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          stats.totalMessages > 0
                            ? (stats.aiMessages / stats.totalMessages) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.aiMessages}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Respuestas IA
                    </p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stats.teamMembers}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Miembros
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Events Summary */}
          {Object.keys(stats.eventsSummary).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Actividad del Sistema
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stats.eventsSummary).map(([eventType, count]) => (
                  <div
                    key={eventType}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">
                      {eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400 mb-8">
          No hay datos disponibles
        </div>
      )}
    </div>
  );
}
