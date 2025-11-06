import { Code, Book, Key, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function APIDocsPage() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/conversations',
      description: 'Obtener lista de conversaciones',
      status: 'Documentado',
    },
    {
      method: 'POST',
      path: '/api/messages',
      description: 'Enviar un mensaje',
      status: 'Documentado',
    },
    {
      method: 'POST',
      path: '/api/documents/upload',
      description: 'Subir un documento',
      status: 'Documentado',
    },
    {
      method: 'DELETE',
      path: '/api/documents/:id',
      description: 'Eliminar un documento',
      status: 'Documentado',
    },
  ];

  return (
    <div className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Code className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Documentación API
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Integra Resply en tu aplicación con nuestra API REST
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-12">
          <p className="text-center text-blue-900 dark:text-blue-100">
            📚 <strong>En desarrollo</strong> - La documentación completa de la API estará disponible próximamente. Mientras tanto, contacta con{' '}
            <a href="/help/contact" className="underline font-medium">
              soporte
            </a>
            {' '}para acceso anticipado.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <Key className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Autenticación
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Usa API keys para autenticar tus requests
            </p>
          </Card>

          <Card className="p-6">
            <Zap className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Rate Limits
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              1000 requests/hora en plan Professional
            </p>
          </Card>

          <Card className="p-6">
            <Book className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Webhooks
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recibe notificaciones en tiempo real
            </p>
          </Card>
        </div>

        {/* Example Endpoints */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Endpoints Disponibles
          </h2>

          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          endpoint.method === 'GET'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : endpoint.method === 'POST'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-900 dark:text-white">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {endpoint.description}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {endpoint.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Ejemplo de Request
          </h2>

          <Card className="p-6">
            <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100">
                <code>{`curl -X POST https://api.resply.com/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "conversationId": "conv_123",
    "message": "¿Cuál es el horario de atención?",
    "userId": "user_456"
  }'`}</code>
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
