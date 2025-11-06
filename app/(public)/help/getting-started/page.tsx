import Link from 'next/link';
import {
  CheckCircle2,
  Upload,
  Settings,
  Code,
  Users,
  Rocket
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function GettingStartedPage() {
  const steps = [
    {
      number: 1,
      title: 'Crea tu cuenta',
      description: 'Regístrate en Resply con tu email. No necesitas tarjeta de crédito.',
      icon: CheckCircle2,
      details: [
        'Ve a la página de registro',
        'Ingresa tu email y contraseña',
        'Verifica tu email',
        'Inicia sesión por primera vez',
      ],
      time: '2 minutos',
    },
    {
      number: 2,
      title: 'Configura tu workspace',
      description: 'Crea tu primer workspace y personaliza la configuración básica.',
      icon: Settings,
      details: [
        'Dale un nombre a tu workspace',
        'Personaliza el logo y colores',
        'Configura el mensaje de bienvenida',
        'Define horarios de atención (opcional)',
      ],
      time: '3 minutos',
    },
    {
      number: 3,
      title: 'Sube tu base de conocimientos',
      description: 'Añade los documentos que usará tu chatbot para responder preguntas.',
      icon: Upload,
      details: [
        'Ve a la sección "Documentos"',
        'Click en "Subir documento"',
        'Selecciona archivos TXT, DOCX o DOC',
        'Espera a que se procesen (1-2 minutos por documento)',
      ],
      time: '5 minutos',
      tips: [
        'Tip: Empieza con 3-5 documentos clave',
        'Tip: Usa nombres descriptivos para tus archivos',
        'Tip: Asegúrate de que los documentos tengan buena estructura',
      ],
    },
    {
      number: 4,
      title: 'Personaliza tu widget',
      description: 'Configura el aspecto y comportamiento del chatbot embebido.',
      icon: Code,
      details: [
        'Ve a la sección "Widget"',
        'Elige colores y posición',
        'Personaliza el avatar y mensajes',
        'Prueba el widget en vista previa',
      ],
      time: '5 minutos',
    },
    {
      number: 5,
      title: 'Instala el widget',
      description: 'Añade el código del widget a tu sitio web.',
      icon: Rocket,
      details: [
        'Copia el código JavaScript proporcionado',
        'Pégalo antes de </body> en tu HTML',
        'Guarda y publica tu sitio',
        'Verifica que el widget aparece correctamente',
      ],
      time: '3 minutos',
      codeExample: true,
    },
  ];

  return (
    <div className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Rocket className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Guía de Inicio Rápido
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Configura tu chatbot inteligente en 5 sencillos pasos. Tiempo estimado: <strong>20 minutos</strong>
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="p-8">
                <div className="flex items-start gap-6">
                  {/* Step Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {step.title}
                      </h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                        ⏱️ {step.time}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <div className="space-y-2 mb-4">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {detail}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    {step.tips && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          💡 Consejos:
                        </p>
                        <ul className="space-y-1">
                          {step.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-blue-700 dark:text-blue-300">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Code Example */}
                    {step.codeExample && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ejemplo de código:
                        </p>
                        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-gray-100">
                            <code>{`<!-- Añade este código antes de </body> -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','resply','https://widget.resply.com/widget.js'));
  resply('init', { widgetId: 'TU_WIDGET_ID' });
</script>`}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Next Steps */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Próximos Pasos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/help/faq"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Preguntas Frecuentes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encuentra respuestas a dudas comunes
              </p>
            </Link>
            <Link
              href="/help/api-docs"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Documentación API
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Integra Resply programáticamente
              </p>
            </Link>
            <Link
              href="/dashboard"
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors md:col-span-2"
            >
              <h3 className="font-semibold mb-1">
                🚀 Ir al Dashboard
              </h3>
              <p className="text-sm text-blue-100">
                Comienza a configurar tu chatbot ahora
              </p>
            </Link>
          </div>
        </Card>

        {/* Video Tutorial CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            ¿Prefieres ver un video?
          </p>
          <Link
            href="/help/tutorials"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            <span>Ver tutoriales en video</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
