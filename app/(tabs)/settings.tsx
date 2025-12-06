import React, { useRef, useCallback } from 'react';
import { Alert, Text, TouchableOpacity, View, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { missingSupabaseConfigMessage, supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';

const SettingsScreen = () => {
  const { session, isSupabaseConfigured, error } = useAuth();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top cuando el tab se enfoca
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, [])
  );

  const handleLogout = async () => {
    if (!supabase) {
      Alert.alert('Configuración requerida', missingSupabaseConfigMessage);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      Alert.alert('Error', signOutError.message);
    }
  };

  const themeOptions = [
    { id: 'light' as const, label: 'Claro', icon: Sun },
    { id: 'dark' as const, label: 'Oscuro', icon: Moon },
    { id: 'system' as const, label: 'Sistema', icon: Smartphone },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Text className="text-3xl font-bold text-foreground mb-6">Ajustes</Text>

      {/* Theme Selector */}
      <View className="bg-card p-4 rounded-lg mb-6">
        <Text className="text-lg font-semibold text-card-foreground mb-4">Apariencia</Text>

        <View className="gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = themeMode === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setThemeMode(option.id)}
                className={`
                  flex-row items-center justify-between p-4 rounded-lg
                  ${isSelected ? 'bg-primary' : 'bg-muted'}
                `}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Tema ${option.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View className="flex-row items-center gap-3">
                  <Icon
                    size={24}
                    color={isSelected ? theme.colors.primaryForeground : theme.colors.mutedForeground}
                  />
                  <Text
                    className={`text-base font-medium ${
                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {option.label}
                  </Text>
                </View>

                {isSelected && (
                  <View className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {themeMode === 'system' && (
          <Text className="text-sm text-muted-foreground mt-3">
            {isDark ? '🌙 Usando tema oscuro del sistema' : '☀️ Usando tema claro del sistema'}
          </Text>
        )}
      </View>

      {/* Supabase Status / Auth */}
      {!isSupabaseConfigured ? (
        <View className="bg-warning/10 p-4 rounded-lg mb-6 border border-warning/20">
          <Text className="text-lg font-semibold text-warning-foreground mb-2">
            Modo de prueba
          </Text>
          <Text className="text-base text-warning-foreground/80">
            Estás usando la app en modo de prueba. Configura Supabase para activar todas las funciones.
          </Text>
        </View>
      ) : error ? (
        <EmptyState
          title="No se pudo cargar la sesión"
          message={error}
        />
      ) : (
        <>
          {session?.user && (
            <View className="bg-card p-4 rounded-lg mb-6">
              <Text className="text-base text-muted-foreground mb-1">Sesión iniciada como:</Text>
              <Text className="text-lg font-semibold text-card-foreground">
                {session.user.email}
              </Text>
            </View>
          )}

          {session && (
            <TouchableOpacity
              className="bg-destructive rounded-lg py-4"
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              accessibilityHint="Cierra tu sesión actual"
            >
              <Text className="text-destructive-foreground text-center text-lg font-semibold">
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
