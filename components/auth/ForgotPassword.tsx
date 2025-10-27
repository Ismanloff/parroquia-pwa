'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

export function ForgotPassword({ onSwitchToLogin }: ForgotPasswordProps) {
  const { resetPassword, error, loading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccess(false);
    clearError();

    if (!email) {
      setLocalError('Por favor, ingresa tu correo electrónico');
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              ¡Email enviado!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Hemos enviado un enlace para restablecer tu contraseña a{' '}
              <span className="font-semibold">{email}</span>. Revisa tu bandeja
              de entrada y tu carpeta de spam.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            {/* Error Message */}
            {(error || localError) && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {error || localError}
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </button>
          </div>
        </form>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
