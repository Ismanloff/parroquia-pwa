import Link from 'next/link';
import {
  BookOpen,
  Code,
  HelpCircle,
  Mail,
  PlayCircle,
  Rocket,
  Search
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function HelpCenterPage() {
  const categories = [
    {
      title: 'Empezar',
      description: 'Guía rápida para configurar tu primer chatbot',
      icon: Rocket,
      href: '/help/getting-started',
      color: 'blue',
    },
    {
      title: 'Tutoriales',
      description: 'Videos paso a paso para dominar Resply',
      icon: PlayCircle,
      href: '/help/tutorials',
      color: 'purple',
    },
    {
      title: 'Documentación API',
      description: 'Referencia completa de nuestra API REST',
      icon: Code,
      href: '/help/api-docs',
      color: 'green',
    },
    {
      title: 'Preguntas Frecuentes',
      description: 'Respuestas a las dudas más comunes',
      icon: HelpCircle,
      href: '/help/faq',
      color: 'orange',
    },
  ];

  const popularArticles = [
    {
      title: '¿Cómo subo documentos a mi base de conocimientos?',
      href: '/help/getting-started#upload-documents',
      category: 'Empezar',
    },
    {
      title: '¿Cómo instalo el widget en mi sitio web?',
      href: '/help/getting-started#install-widget',
      category: 'Empezar',
    },
    {
      title: '¿Cuántos documentos puedo subir?',
      href: '/help/faq#limits',
      category: 'FAQ',
    },
    {
      title: '¿Cómo invito a mi equipo?',
      href: '/help/getting-started#team',
      category: 'Empezar',
    },
  ];

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Encuentra respuestas, tutoriales y documentación
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en el centro de ayuda..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category) => {
            const Icon = category.icon;
            const colorClasses = {
              blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
              green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
              orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            }[category.color];

            return (
              <Link
                key={category.title}
                href={category.href}
                className="group"
              >
                <Card className="h-full p-6 hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Popular Articles */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Artículos Populares
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularArticles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className="group"
              >
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 block">
                    {article.category}
                  </span>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 text-center">
          <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Nuestro equipo de soporte está aquí para ayudarte
          </p>
          <Link
            href="/help/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Contactar Soporte</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
