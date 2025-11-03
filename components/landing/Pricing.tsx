'use client';

import { Check, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function Pricing() {
  const plans = [
    {
      name: 'Básico',
      price: '$29',
      period: '/mes',
      description: 'Perfecto para pequeños negocios',
      features: [
        '1 Workspace',
        'Hasta 500 consultas/mes',
        '10 GB de almacenamiento',
        'Soporte por email',
        'Documentación básica',
      ],
      cta: 'Comenzar Gratis',
      popular: false,
    },
    {
      name: 'Profesional',
      price: '$79',
      period: '/mes',
      description: 'Ideal para comunidades en crecimiento',
      features: [
        '5 Workspaces',
        'Hasta 5,000 consultas/mes',
        '100 GB de almacenamiento',
        'Soporte prioritario',
        'API completa',
        'Analytics avanzados',
        'Personalización de marca',
      ],
      cta: 'Comenzar Ahora',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Para organizaciones grandes',
      features: [
        'Workspaces ilimitados',
        'Consultas ilimitadas',
        'Almacenamiento ilimitado',
        'Soporte 24/7 dedicado',
        'SLA garantizado',
        'Capacitación personalizada',
        'Integración custom',
        'Multi-región',
      ],
      cta: 'Contactar Ventas',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Planes Transparentes
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Elige el plan perfecto para tu comunidad. Sin sorpresas, sin costos ocultos.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 ${
                plan.popular
                  ? 'ring-2 ring-blue-600 dark:ring-blue-400 shadow-2xl scale-105'
                  : ''
              } relative hover:shadow-xl transition-all duration-300`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="info" className="px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {plan.cta}
              </button>
            </Card>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Todos los planes incluyen 14 días de prueba gratuita. Sin tarjeta de crédito requerida.
          </p>
        </div>
      </div>
    </section>
  );
}
