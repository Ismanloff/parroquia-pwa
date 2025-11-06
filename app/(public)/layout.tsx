import type { Metadata } from 'next';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resply - Help Center',
  description: 'Centro de ayuda y documentación de Resply',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Resply
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/help"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FileQuestion className="w-4 h-4" />
                <span>Centro de Ayuda</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Volver al inicio</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 Resply. Todos los derechos reservados.</p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link
                href="/help"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Centro de Ayuda
              </Link>
              <span>•</span>
              <Link
                href="/help/contact"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
