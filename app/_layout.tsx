import '../polyfills'; // ⚠️ DEBE ser la primera importación
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { registerServiceWorker, initInstallPrompt } from '@/utils/registerServiceWorker';
import '../global.css';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore double calls in fast refresh
});

// QueryClient configurado para NO cachear mutations (cada mensaje debe ser único)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Queries (GET): cache normal
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes llamado cacheTime)
    },
    mutations: {
      // Mutations (POST): SIN retry ni cache
      retry: 0, // No reintentar (cada mensaje es único)
      gcTime: 0, // NO cachear mutations (causaba bug de respuestas repetidas)
    },
  },
});

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Root error boundary caught an error:', error, info);
    void SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 justify-center items-center p-lg bg-background">
          <Text className="text-xl font-bold text-destructive text-center mb-sm">
            Ha ocurrido un error inesperado
          </Text>
          <Text className="text-base text-muted-foreground text-center">
            {this.state.error.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const RootLayout = () => {
  // Registrar Service Worker cuando corra en web
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('🌐 Plataforma web detectada, inicializando PWA...');

      // Registrar Service Worker
      registerServiceWorker().catch((error) => {
        console.error('❌ Error registrando Service Worker:', error);
      });

      // Inicializar prompt de instalación
      initInstallPrompt();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootErrorBoundary>
          <AuthProvider>
            <Main />
          </AuthProvider>
        </RootErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const Main = () => {
  const { loading, error, isSupabaseConfigured } = useAuth();

  useEffect(() => {
    if (!loading) {
      void SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [loading]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error && isSupabaseConfigured) {
    return (
      <View className="flex-1 justify-center items-center p-lg bg-background">
        <Text className="text-xl font-bold text-destructive text-center mb-sm">
          No se pudo cargar la sesión
        </Text>
        <Text className="text-base text-muted-foreground text-center">
          {error}
        </Text>
      </View>
    );
  }

  return <Slot />;
};

export default RootLayout;
