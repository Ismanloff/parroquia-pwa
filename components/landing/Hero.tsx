'use client';

import { ArrowRight, Play, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section id="home" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 -z-10" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Asistente Digital con IA
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
                Tu asistente
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  de soporte 24/7
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
                Gestiona consultas, documentos y conversaciones con inteligencia artificial.
                Disponible siempre para tus clientes.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="primary" className="text-lg px-8 py-4 flex items-center gap-2">
                Comenzar Gratis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" className="text-lg px-8 py-4 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">1,000+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Consultas Atendidas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">24/7</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Disponibilidad</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">98%</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Satisfacción</p>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Card */}
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white/20 dark:border-slate-700/30">
              {/* Chat Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Asistente Resply</h3>
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full" />
                      En línea
                    </p>
                  </div>
                </div>

                {/* Message Bubbles */}
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                      <p className="text-sm">¿Cuál es el horario de atención?</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                      <p className="text-sm text-slate-900 dark:text-white">
                        Nuestro horario de atención es: Lunes a Viernes de 9:00 AM a 6:00 PM. También puedes escribirnos 24/7 y te responderemos lo antes posible.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                      <p className="text-sm">Gracias!</p>
                    </div>
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Escribiendo...</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-xl border border-white/20 dark:border-slate-700/30">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">IA Activa</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-xl border border-white/20 dark:border-slate-700/30">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
                  <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white dark:border-slate-800" />
                  <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">+100 usuarios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
