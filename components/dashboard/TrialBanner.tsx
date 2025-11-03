'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface TrialBannerProps {
  workspaceId?: string;
}

export function TrialBanner({ workspaceId }: TrialBannerProps) {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`);
        const data = await response.json();

        if (data.workspace) {
          setWorkspace(data.workspace);

          // Calculate days left if trialing
          if (data.workspace.billing_status === 'trialing' && data.workspace.trial_ends_at) {
            const trialEnd = new Date(data.workspace.trial_ends_at);
            const now = new Date();
            const diffTime = trialEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(diffDays);
          }
        }
      } catch (error) {
        console.error('Error fetching workspace:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  // Don't show if dismissed, not trialing, or loading
  if (loading || dismissed || !workspace || workspace.billing_status !== 'trialing') {
    return null;
  }

  // Don't show if trial expired
  if (daysLeft < 0) {
    return null;
  }

  // Determine color scheme based on days left
  const isUrgent = daysLeft <= 3;
  const isWarning = daysLeft > 3 && daysLeft <= 7;

  return (
    <div
      className={`relative ${
        isUrgent
          ? 'bg-gradient-to-r from-red-500 to-pink-600'
          : isWarning
          ? 'bg-gradient-to-r from-amber-500 to-orange-600'
          : 'bg-gradient-to-r from-blue-600 to-indigo-700'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {isUrgent ? (
              <Clock className="w-5 h-5 text-white animate-pulse" />
            ) : (
              <Zap className="w-5 h-5 text-white" />
            )}

            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {isUrgent ? (
                  <>
                    <span className="font-bold">¡Solo quedan {daysLeft} días!</span> Tu prueba PRO está por terminar.
                  </>
                ) : isWarning ? (
                  <>
                    Quedan <span className="font-bold">{daysLeft} días</span> de tu prueba PRO gratuita.
                  </>
                ) : (
                  <>
                    🎉 Estás usando el <span className="font-bold">Plan PRO</span> gratis por {daysLeft} días más.
                  </>
                )}
              </p>
              <p className="text-white/80 text-xs mt-0.5">
                {isUrgent ? (
                  'Actualiza ahora para no perder acceso a las funciones PRO'
                ) : (
                  'Actualiza en cualquier momento para mantener todas las funciones'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/billing">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm"
              >
                {isUrgent ? 'Actualizar Ahora' : 'Ver Planes'}
              </Button>
            </Link>

            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
              aria-label="Cerrar banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
