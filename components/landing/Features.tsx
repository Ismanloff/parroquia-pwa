'use client';

import { MessageSquare, FileText, Zap, Shield, Globe, Brain, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function Features() {
  const features = [
    {
      icon: Brain,
      title: 'Inteligencia Artificial Avanzada',
      description: 'Respuestas contextuales y precisas gracias a modelos de IA de última generación.',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      icon: MessageSquare,
      title: 'Chat Inteligente',
      description: 'Conversaciones naturales con tu comunidad, disponibles en cualquier momento.',
      gradient: 'from-purple-600 to-pink-600',
    },
    {
      icon: FileText,
      title: 'Gestión de Documentos',
      description: 'Organiza y busca información en todos tus documentos empresariales.',
      gradient: 'from-green-600 to-emerald-600',
    },
    {
      icon: Zap,
      title: 'Respuestas Instantáneas',
      description: 'Velocidad de respuesta optimizada para atender consultas sin demoras.',
      gradient: 'from-yellow-600 to-orange-600',
    },
    {
      icon: Shield,
      title: 'Seguridad Garantizada',
      description: 'Protección de datos con las mejores prácticas de seguridad y privacidad.',
      gradient: 'from-red-600 to-rose-600',
    },
    {
      icon: Globe,
      title: 'Multi-workspace',
      description: 'Gestiona múltiples equipos desde una sola plataforma centralizada.',
      gradient: 'from-cyan-600 to-blue-600',
    },
    {
      icon: Clock,
      title: 'Disponibilidad 24/7',
      description: 'Tu asistente nunca duerme, siempre listo para ayudar a tus clientes.',
      gradient: 'from-violet-600 to-purple-600',
    },
    {
      icon: Users,
      title: 'Gestión de Usuarios',
      description: 'Administra permisos y roles para tu equipo de trabajo de manera sencilla.',
      gradient: 'from-indigo-600 to-blue-600',
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Características Poderosas
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Todo lo que necesitas para gestionar tu atención al cliente de manera eficiente
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            ¿Listo para transformar tu atención al cliente?
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl">
            Comenzar Ahora
          </button>
        </div>
      </div>
    </section>
  );
}
