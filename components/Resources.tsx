'use client';

import { BookOpen, FileText, ExternalLink } from 'lucide-react';

const resources = [
  {
    title: 'Solicitud de Bautismo',
    description: 'Formulario para solicitar el sacramento del Bautismo',
    icon: FileText,
    link: '#',
  },
  {
    title: 'Horarios de Misa',
    description: 'Consulta los horarios de celebraciones',
    icon: FileText,
    link: '#',
  },
  {
    title: 'Contacto Parroquial',
    description: 'Información de contacto y ubicación',
    icon: FileText,
    link: '#',
  },
];

export function Resources() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Recursos</h1>
          <p className="text-sm text-slate-500">Documentos y enlaces útiles</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <a
                key={index}
                href={resource.link}
                className="block bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{resource.title}</h3>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
                  </div>
                </div>
              </a>
            );
          })}

          {/* Info message */}
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Más recursos próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
