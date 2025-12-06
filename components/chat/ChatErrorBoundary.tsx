import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

/**
 * Error Boundary para el chat
 *
 * Captura errores durante el renderizado de mensajes y muestra
 * una UI de recuperación en lugar de crashear toda la app.
 *
 * Mejora la resiliencia del chat cuando:
 * - Un mensaje tiene contenido malformado
 * - Falla el renderizado de markdown
 * - Problemas con attachments o quick actions
 */
export class ChatErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Actualizar estado para mostrar UI de error
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log del error para debugging
    console.error('❌ [ChatErrorBoundary] Error capturado:', error);
    console.error('📍 [ChatErrorBoundary] Stack trace:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Resetear el error boundary
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * UI de recuperación cuando ocurre un error
 */
const ErrorFallback: React.FC<{ error: Error | null; onReset: () => void }> = ({ error, onReset }) => {
  const { theme } = useTheme();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className="rounded-3xl p-6 items-center"
        style={{
          backgroundColor: theme.colors.muted,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {/* Icono de advertencia */}
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: theme.colors.destructive + '20' }}
        >
          <AlertTriangle size={32} color={theme.colors.destructive} strokeWidth={2} />
        </View>

        {/* Título */}
        <Text
          className="text-center font-semibold mb-2"
          style={{ color: theme.colors.foreground, fontSize: 18 }}
        >
          Error en el chat
        </Text>

        {/* Descripción */}
        <Text
          className="text-center mb-4"
          style={{ color: theme.colors.mutedForeground, fontSize: 14, lineHeight: 20 }}
        >
          Ocurrió un problema al mostrar los mensajes. Toca el botón para reintentar.
        </Text>

        {/* Mensaje de error (solo en dev) */}
        {__DEV__ && error && (
          <View
            className="rounded-xl p-3 mb-4 w-full"
            style={{ backgroundColor: theme.colors.background }}
          >
            <Text
              className="font-mono text-xs"
              style={{ color: theme.colors.mutedForeground }}
              numberOfLines={3}
            >
              {error.message}
            </Text>
          </View>
        )}

        {/* Botón de reintentar */}
        <TouchableOpacity
          onPress={onReset}
          className="flex-row items-center gap-2 px-6 py-3 rounded-full"
          style={{ backgroundColor: theme.colors.primary }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
        >
          <RefreshCw size={18} color={theme.colors.primaryForeground} strokeWidth={2.5} />
          <Text
            className="font-semibold"
            style={{ color: theme.colors.primaryForeground, fontSize: 16 }}
          >
            Reintentar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
