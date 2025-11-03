'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { CheckCircle, ChevronRight, Building2, MessageSquare, FileText } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: typeof Building2;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Configura tu Workspace',
    description: 'Personaliza el nombre de tu empresa',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Personaliza el Chatbot',
    description: 'Configura el tono y mensaje de bienvenida',
    icon: MessageSquare,
  },
  {
    id: 3,
    title: 'Sube tu Primer Documento',
    description: 'Añade información a tu base de conocimiento (opcional)',
    icon: FileText,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>('');

  // Step 1 data
  const [workspaceName, setWorkspaceName] = useState('');
  const [chatbotName, setChatbotName] = useState('Asistente');

  // Step 2 data
  const [tone, setTone] = useState<'formal' | 'friendly' | 'professional'>('friendly');
  const [language, setLanguage] = useState<'es' | 'en' | 'fr' | 'pt'>('es');
  const [welcomeMessage, setWelcomeMessage] = useState('¡Hola! ¿En qué puedo ayudarte?');

  // Step 3 data
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Fetch user's workspace
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/workspaces/my-workspace');
        const data = await response.json();

        if (data.workspace) {
          setWorkspaceId(data.workspace.id);
          setWorkspaceName(data.workspace.name);
        } else {
          // No workspace found, redirect to landing
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching workspace:', error);
      }
    };

    fetchWorkspace();
  }, [user, router]);

  const handleStep1Submit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/workspaces/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: workspaceName,
        }),
      });

      if (!response.ok) throw new Error('Error updating workspace');

      // Update onboarding progress
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          currentStep: 2,
          completedSteps: ['step1'],
        }),
      });

      setCurrentStep(2);
    } catch (error) {
      console.error('Error in step 1:', error);
      alert('Error al guardar. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/workspaces/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          chatbot_name: chatbotName,
          tone,
          language,
          welcome_message: welcomeMessage,
        }),
      });

      if (!response.ok) throw new Error('Error updating settings');

      // Update onboarding progress
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          currentStep: 3,
          completedSteps: ['step1', 'step2'],
        }),
      });

      setCurrentStep(3);
    } catch (error) {
      console.error('Error in step 2:', error);
      alert('Error al guardar. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async () => {
    setLoading(true);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('workspaceId', workspaceId);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Error uploading document');
      }

      // Mark onboarding as complete
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          currentStep: 4,
          completedSteps: ['step1', 'step2', 'step3'],
          completed: true,
        }),
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error in step 3:', error);
      alert('Error al finalizar. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStep3 = async () => {
    setLoading(true);

    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          currentStep: 4,
          completedSteps: ['step1', 'step2'],
          skippedSteps: ['step3'],
          completed: true,
        }),
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error skipping step:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !workspaceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Resply</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Paso {currentStep} de {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-4 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {/* Step 1: Workspace Configuration */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  ¡Bienvenido a Resply!
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Comencemos configurando tu workspace
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre de tu Empresa
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Mi Empresa SaaS"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre del Chatbot
                </label>
                <input
                  type="text"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="Asistente"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleStep1Submit}
                disabled={loading || !workspaceName}
                className="w-full flex items-center justify-center gap-2"
              >
                {loading ? 'Guardando...' : 'Continuar'}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 2: Chatbot Customization */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Personaliza tu Chatbot
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Configura el tono y el estilo de comunicación
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tono de Comunicación
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="formal">Formal</option>
                  <option value="friendly">Amigable</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Idioma
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mensaje de Bienvenida
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleStep2Submit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2"
              >
                {loading ? 'Guardando...' : 'Continuar'}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Step 3: Upload Document */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Sube tu Primer Documento
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Añade información para que tu chatbot pueda responder preguntas (opcional)
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                  Seleccionar archivo
                </label>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  PDF, DOC, DOCX, TXT (máx. 10MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-4">
                    ✓ {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleSkipStep3}
                  disabled={loading}
                  className="flex-1"
                >
                  Saltar por ahora
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStep3Submit}
                  disabled={loading || !selectedFile}
                  className="flex-1"
                >
                  {loading ? 'Finalizando...' : 'Finalizar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
