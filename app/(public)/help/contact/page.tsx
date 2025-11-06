'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contacta con Soporte
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Nuestro equipo está aquí para ayudarte. Responderemos en menos de 24 horas.
          </p>
        </div>

        <Card className="p-8">
          {isSubmitted ? (
            // Success Message
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Mensaje Enviado!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Hemos recibido tu mensaje. Te responderemos pronto.
              </p>
            </div>
          ) : (
            // Contact Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Juan Pérez"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="juan@example.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Asunto *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Selecciona un asunto</option>
                  <option value="technical">Problema técnico</option>
                  <option value="billing">Facturación</option>
                  <option value="feature">Solicitud de feature</option>
                  <option value="general">Consulta general</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  placeholder="Describe tu consulta o problema en detalle..."
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar Mensaje
                  </span>
                )}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Al enviar este formulario, aceptas nuestra{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  política de privacidad
                </a>
              </p>
            </form>
          )}
        </Card>

        {/* Alternative Contact Methods */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              📧 Email Directo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Para consultas urgentes
            </p>
            <a
              href="mailto:support@resply.com"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              support@resply.com
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              💬 Chat en Vivo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Disponible de 9:00 a 18:00 (CET)
            </p>
            <button
              onClick={() => alert('Chat feature coming soon!')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
              Iniciar chat
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
