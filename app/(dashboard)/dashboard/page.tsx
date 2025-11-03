'use client';

import { BarChart3, Building2, MessageSquare, FileText, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function DashboardPage() {
  // Mock data - en producción vendría de la API
  const stats = [
    {
      name: 'Total Workspaces',
      value: '12',
      change: '+2.5%',
      trend: 'up' as const,
      icon: Building2,
    },
    {
      name: 'Conversaciones',
      value: '1,234',
      change: '+12.3%',
      trend: 'up' as const,
      icon: MessageSquare,
    },
    {
      name: 'Documentos',
      value: '856',
      change: '+8.1%',
      trend: 'up' as const,
      icon: FileText,
    },
    {
      name: 'Usuarios Activos',
      value: '342',
      change: '+5.7%',
      trend: 'up' as const,
      icon: Users,
    },
  ];

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Bienvenido al panel de administración de Resply
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>
                <Badge variant="success" size="sm">
                  {stat.change}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Actividad Reciente
          </h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0"
              >
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Nueva conversación en Workspace #{i}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hace {i * 5} minutos
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Estado del Sistema
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">API Status</span>
                <Badge variant="success" size="sm">Online</Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Database</span>
                <Badge variant="success" size="sm">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Vector Search</span>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Storage</span>
                <Badge variant="info" size="sm">72% Used</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors text-left">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">Nuevo Workspace</p>
            </button>
            <button className="p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors text-left">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">Subir Documento</p>
            </button>
            <button className="p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors text-left">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">Ver Analytics</p>
            </button>
            <button className="p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors text-left">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">Exportar Datos</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
