'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppConnectModal({
  isOpen,
  onClose,
}: WhatsAppConnectModalProps) {
  const [provider, setProvider] = useState<'kapso' | 'meta'>('kapso');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: 'WhatsApp Channel',
    // Kapso fields
    kapsoApiKey: '',
    kapsoPhoneNumberId: '',
    kapsoWebhookSecret: '',
    // Meta fields
    metaAccessToken: '',
    metaPhoneNumberId: '',
    metaBusinessAccountId: '',
    metaWebhookVerifyToken: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get workspace ID from localStorage or context
      const workspaceId = localStorage.getItem('currentWorkspaceId');

      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      const response = await fetch('/api/whatsapp/channels/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          provider,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect channel');
      }

      setSuccess(true);
      setWebhookUrl(data.webhookUrl);

      // Reset form after success
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to show new channel
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Conectar WhatsApp Business
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-6">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
              <CheckCircle className="w-8 h-8" />
              <h3 className="text-lg font-semibold">¡Canal conectado exitosamente!</h3>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Paso final: Configurar webhook
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Copia esta URL y configúrala en {provider === 'kapso' ? 'Kapso Dashboard' : 'Meta Business Manager'}:
              </p>
              <div className="bg-white dark:bg-gray-900 p-3 rounded border border-blue-300 dark:border-blue-700 font-mono text-sm flex items-center justify-between">
                <span className="truncate mr-2">{webhookUrl}</span>
                <button
                  onClick={copyWebhookUrl}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  {copiedWebhook ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <a
              href={provider === 'kapso' ? 'https://kapso.ai/dashboard' : 'https://business.facebook.com/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Abrir {provider === 'kapso' ? 'Kapso Dashboard' : 'Meta Business Manager'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecciona proveedor
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProvider('kapso')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    provider === 'kapso'
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Kapso (Recomendado)
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Setup en 2 minutos
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('meta')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    provider === 'meta'
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Meta Direct
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    API oficial de Meta
                  </p>
                </button>
              </div>
            </div>

            {/* Channel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del canal
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: WhatsApp Ventas"
              />
            </div>

            {/* Kapso Configuration */}
            {provider === 'kapso' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kapso API Key
                  </label>
                  <input
                    type="text"
                    value={formData.kapsoApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, kapsoApiKey: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="ka-..."
                  />
                  <a
                    href="https://kapso.ai/dashboard/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    Obtener API key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={formData.kapsoPhoneNumberId}
                    onChange={(e) =>
                      setFormData({ ...formData, kapsoPhoneNumberId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook Secret
                  </label>
                  <input
                    type="text"
                    value={formData.kapsoWebhookSecret}
                    onChange={(e) =>
                      setFormData({ ...formData, kapsoWebhookSecret: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="Your webhook secret"
                  />
                </div>
              </>
            )}

            {/* Meta Configuration */}
            {provider === 'meta' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Token
                  </label>
                  <input
                    type="text"
                    value={formData.metaAccessToken}
                    onChange={(e) =>
                      setFormData({ ...formData, metaAccessToken: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="EAA..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={formData.metaPhoneNumberId}
                    onChange={(e) =>
                      setFormData({ ...formData, metaPhoneNumberId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Account ID
                  </label>
                  <input
                    type="text"
                    value={formData.metaBusinessAccountId}
                    onChange={(e) =>
                      setFormData({ ...formData, metaBusinessAccountId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="987654321"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook Verify Token
                  </label>
                  <input
                    type="text"
                    value={formData.metaWebhookVerifyToken}
                    onChange={(e) =>
                      setFormData({ ...formData, metaWebhookVerifyToken: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="Your custom verify token"
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Conectando...' : 'Conectar Canal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
