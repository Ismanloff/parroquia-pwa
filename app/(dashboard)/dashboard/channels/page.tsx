'use client';

import { useState } from 'react';
import { MessageSquare, Instagram, Facebook, Globe } from 'lucide-react';
import WhatsAppConnectModal from '@/components/channels/WhatsAppConnectModal';

export default function ChannelsPage() {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Canales de Comunicación
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conecta múltiples canales para centralizar todas tus conversaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                WhatsApp Business
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Conecta tu cuenta de WhatsApp Business para recibir y responder mensajes.
              </p>
              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Conectar WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Instagram Direct
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Responde mensajes directos de Instagram desde un solo lugar.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-sm font-medium rounded-md">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Próximamente
              </div>
            </div>
          </div>
        </div>

        {/* Facebook Messenger */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Facebook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Facebook Messenger
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Gestiona conversaciones de tu página de Facebook.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-sm font-medium rounded-md">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Próximamente
              </div>
            </div>
          </div>
        </div>

        {/* Web Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Widget Web
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Embebe un chat en tu sitio web para recibir mensajes de visitantes.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-sm font-medium rounded-md">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Próximamente
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          ¿Cuándo estarán disponibles?
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
          Estamos trabajando en las integraciones con WhatsApp Business API, Instagram y Facebook Messenger.
          Estas funcionalidades requieren aprobación de Meta y configuración de webhooks.
        </p>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          El Widget Web estará disponible en la <strong>Fase 3</strong> del roadmap (próximas semanas).
        </p>
      </div>

      {/* Notification CTA */}
      <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Recibe una notificación cuando estén listos
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Te avisaremos por email cuando estas integraciones estén disponibles.
        </p>
        <button
          disabled
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg font-medium cursor-not-allowed"
        >
          Notificarme (Próximamente)
        </button>
      </div>

      {/* WhatsApp Connect Modal */}
      {showWhatsAppModal && (
        <WhatsAppConnectModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
}
