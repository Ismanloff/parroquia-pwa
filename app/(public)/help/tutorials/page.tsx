import { PlayCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function TutorialsPage() {
  const tutorials = [
    {
      title: 'Configuración inicial de Resply',
      duration: '5:30',
      views: '2.5k',
      thumbnail: '/placeholder-tutorial.jpg',
      description: 'Aprende a configurar tu cuenta y crear tu primer workspace.',
    },
    {
      title: 'Cómo subir y organizar documentos',
      duration: '8:45',
      views: '1.8k',
      thumbnail: '/placeholder-tutorial.jpg',
      description: 'Guía completa sobre la gestión de tu base de conocimientos.',
    },
    {
      title: 'Personalizar el widget de chat',
      duration: '6:20',
      views: '1.2k',
      thumbnail: '/placeholder-tutorial.jpg',
      description: 'Personaliza colores, mensajes y comportamiento del widget.',
    },
    {
      title: 'Instalar Resply en WordPress',
      duration: '4:15',
      views: '950',
      thumbnail: '/placeholder-tutorial.jpg',
      description: 'Paso a paso para integrar Resply en tu sitio WordPress.',
    },
  ];

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <PlayCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tutoriales en Video
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Aprende a usar Resply con nuestras guías visuales paso a paso
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-12">
          <p className="text-center text-blue-900 dark:text-blue-100">
            🎬 <strong>Próximamente</strong> - Estamos grabando tutoriales en video para ti. Mientras tanto, consulta nuestra{' '}
            <a href="/help/getting-started" className="underline font-medium">
              guía de inicio rápido
            </a>
            .
          </p>
        </div>

        {/* Placeholder Tutorials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{tutorial.duration}</span>
                  <span>•</span>
                  <span>{tutorial.views} vistas</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {tutorial.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tutorial.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
