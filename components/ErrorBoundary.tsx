'use client';

// Error Boundary - React 19 Best Practices 2025
// NO envolver toda la app - solo secciones específicas
// Basado en: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { haptics } from '@/lib/haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to external service (Sentry, Datadog, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Custom error handler
    this.props.onError?.(error, errorInfo);

    haptics.error();
  }

  handleReset = () => {
    haptics.medium();
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12">
          <div className="bg-red-50/90 dark:bg-red-900/20 backdrop-blur-xl rounded-[28px] p-8 max-w-md w-full border border-red-200/30 dark:border-red-800/30 shadow-lg animate-spring-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {this.props.fallbackTitle || 'Algo salió mal'}
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {this.props.fallbackMessage ||
                  'Ocurrió un error inesperado. Intenta recargar la página.'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 w-full text-left">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer mb-2">
                    Ver detalles del error
                  </summary>
                  <pre className="text-xs bg-red-100 dark:bg-red-900/30 p-3 rounded-lg overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-2xl shadow-lg transition-all active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
