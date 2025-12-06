/**
 * Theme Context + Provider
 *
 * Gestiona el tema (light/dark) de la aplicación
 * - Detecta preferencia del sistema (useColorScheme)
 * - Permite toggle manual
 * - Persiste preferencia en AsyncStorage
 * - Compatible con React Native (NO usa DOM)
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TEMPORAL: Comentado hasta crear development build
// import { useSharedValue, withTiming, useDerivedValue } from 'react-native-reanimated';
import { lightTheme, darkTheme, type Theme } from '@/constants/themes';
import { useColorScheme } from 'nativewind';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  // TEMPORAL: Comentado hasta crear development build
  // themeTransition: any; // SharedValue<number> - 0 = light, 1 = dark
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@parroquia/theme-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const { setColorScheme: setNativeWindColorScheme } = useColorScheme();

  // TEMPORAL: Comentado hasta crear development build
  // const themeTransition = useSharedValue(0);

  // Cargar preferencia guardada
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    }
    loadTheme();
  }, []);

  // Determinar tema actual
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  // ✅ Sincronizar con NativeWind cuando cambia el tema
  useEffect(() => {
    if (setNativeWindColorScheme) {
      setNativeWindColorScheme(isDark ? 'dark' : 'light');
    }
  }, [isDark, setNativeWindColorScheme]);

  // TEMPORAL: Comentado hasta crear development build
  // useEffect(() => {
  //   themeTransition.value = withTiming(isDark ? 1 : 0, {
  //     duration: 300,
  //   });
  // }, [isDark, themeTransition]);

  // Guardar preferencia
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDark,
      setThemeMode,
      toggleTheme,
      // TEMPORAL: Comentado hasta crear development build
      // themeTransition,
    }),
    [theme, themeMode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook para usar el tema
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
