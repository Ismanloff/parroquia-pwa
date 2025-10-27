'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus, Smartphone } from 'lucide-react';

interface IOSInstallInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSInstallInstructions({ isOpen, onClose }: IOSInstallInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setCurrentStep(0));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      icon: Share,
      title: 'Paso 1: Toca Compartir',
      description: 'Toca el botón de compartir en la barra inferior de Safari',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Plus,
      title: 'Paso 2: Añadir a Inicio',
      description: 'Desplázate y selecciona "Añadir a la pantalla de inicio"',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: Smartphone,
      title: 'Paso 3: Confirmar',
      description: 'Toca "Añadir" en la esquina superior derecha',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const Step = steps[currentStep];
  const Icon = Step.icon;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (solo móvil) */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Instalar App
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sigue estos pasos para añadir a tu iPhone
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex gap-2 px-6 pb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'bg-blue-600'
                  : index < currentStep
                    ? 'bg-blue-400'
                    : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Animated content */}
        <div className="px-6 py-8">
          <div className="text-center">
            {/* Icon with animation */}
            <div
              className={`w-24 h-24 ${Step.iconBg} dark:bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 transform transition-all duration-500 ${
                isOpen ? 'scale-100 rotate-0' : 'scale-50 rotate-180'
              }`}
            >
              <Icon className={`w-12 h-12 ${Step.iconColor}`} />
            </div>

            {/* Step title */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{Step.title}</h3>

            {/* Step description */}
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              {Step.description}
            </p>

            {/* Visual hint */}
            {currentStep === 0 && (
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Share className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Botón Compartir
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      En la barra inferior
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Busca el ícono ⬆️ en Safari
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Añadir a Inicio
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Opción en el menú</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Desplázate hacia abajo en el menú
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl p-6 mb-6">
                <Smartphone className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  ¡Casi listo!
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  La app aparecerá en tu pantalla de inicio
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="p-6 pt-0 pb-8 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-4 px-6 rounded-2xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Anterior
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex-1 py-4 px-6 rounded-2xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              ¡Entendido!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
