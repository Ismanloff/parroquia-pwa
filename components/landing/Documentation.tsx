'use client';

import { Book, Video, Code, HelpCircle, FileText, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function Documentation() {
  const resources = [
    {
      icon: Book,
      title: 'Guía de Inicio',
      description: 'Aprende a configurar y usar Resply en minutos',
      link: '#',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      icon: Video,
      title: 'Video Tutoriales',
      description: 'Tutoriales paso a paso para dominar todas las funciones',
      link: '#',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    {
      icon: Code,
      title: 'API Documentation',
      description: 'Integra Resply con tus sistemas existentes',
      link: '#',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      icon: HelpCircle,
      title: 'Preguntas Frecuentes',
      description: 'Encuentra respuestas a las dudas más comunes',
      link: '#',
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    },
  ];

  const guides = [
    {
      title: 'Configuración Inicial',
      description: 'Guía completa para configurar tu primer workspace',
      time: '10 min',
    },
    {
      title: 'Gestión de Documentos',
      description: 'Cómo organizar y buscar documentos eficientemente',
      time: '15 min',
    },
    {
      title: 'Personalización del Asistente',
      description: 'Adapta las respuestas a las necesidades de tu comunidad',
      time: '20 min',
    },
  ];

  return (
    <section id="documentation" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Documentación y Recursos
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Todo lo que necesitas saber para sacar el máximo provecho de Resply
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              >
                <div className={`w-12 h-12 ${resource.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                  {resource.title}
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {resource.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Popular Guides */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Guías Populares
          </h3>
          <div className="space-y-4">
            {guides.map((guide, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {guide.title}
                      </h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 ml-8">
                      {guide.description}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                    {guide.time}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 border-0">
            <h3 className="text-2xl font-bold text-white mb-2">
              ¿Necesitas ayuda adicional?
            </h3>
            <p className="text-blue-100 mb-6">
              Nuestro equipo de soporte está listo para ayudarte
            </p>
            <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
              Contactar Soporte
            </button>
          </Card>
        </div>
      </div>
    </section>
  );
}
