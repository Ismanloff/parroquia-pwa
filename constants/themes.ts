/**
 * Design System - Themes
 *
 * Sistema de temas profesional siguiendo:
 * - Material Design 3 (Google)
 * - Human Interface Guidelines (Apple)
 * - WCAG 2.1 AA (Contraste)
 *
 * Basado en: Guía React Native Profesional 2025
 */

export type Theme = {
  colors: {
    // Base colors
    background: string;
    foreground: string;

    // Card/Surface colors
    card: string;
    cardForeground: string;

    // Primary brand color
    primary: string;
    primaryForeground: string;

    // Secondary accent
    secondary: string;
    secondaryForeground: string;

    // Muted/subtle backgrounds
    muted: string;
    mutedForeground: string;

    // Accent color (tertiary)
    accent: string;
    accentForeground: string;

    // Destructive/error
    destructive: string;
    destructiveForeground: string;

    // Success
    success: string;
    successForeground: string;

    // Warning
    warning: string;
    warningForeground: string;

    // Info
    info: string;
    infoForeground: string;

    // Borders
    border: string;
    borderLight: string;

    // Input
    input: string;
    inputForeground: string;

    // Ring (focus)
    ring: string;
  };

  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };

  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    full: number;
  };

  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };

  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
    extrabold: '800';
  };

  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    xl: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };

  animation: {
    duration: {
      fast: number;
      base: number;
      slow: number;
    };
    easing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
};

// ☀️ LIGHT THEME - Tendencias 2025: Colores vibrantes inspirados en naturaleza
export const lightTheme: Theme = {
  colors: {
    background: '#F8FAFC', // Slate 50 - Fondo muy limpio y profesional
    foreground: '#1E293B', // Slate 800 - Texto oscuro suave

    card: '#FFFFFF', // Blanco puro para tarjetas
    cardForeground: '#1E293B',

    primary: '#4F46E5', // Indigo 600 - Elegante, espiritual y moderno
    primaryForeground: '#FFFFFF',

    secondary: '#059669', // Emerald 600 - Esperanza, litúrgico
    secondaryForeground: '#FFFFFF',

    muted: '#F1F5F9', // Slate 100
    mutedForeground: '#64748B', // Slate 500

    accent: '#D97706', // Amber 600 - Dorado sutil
    accentForeground: '#FFFFFF',

    destructive: '#EF4444', // Rojo estándar
    destructiveForeground: '#FFFFFF',

    success: '#10B981', // Verde esmeralda
    successForeground: '#FFFFFF',

    warning: '#F59E0B', // Ámbar cálido
    warningForeground: '#1E293B',

    info: '#3B82F6', // Azul informativo
    infoForeground: '#FFFFFF',

    border: '#E2E8F0', // Slate 200
    borderLight: '#F1F5F9',

    input: '#FFFFFF',
    inputForeground: '#1E293B',

    ring: '#4F46E5', // Indigo para focus
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  animation: {
    duration: {
      fast: 150,
      base: 250,
      slow: 350,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
};

// 🌙 DARK THEME - Tendencias 2025: Alto contraste con acentos vibrantes
export const darkTheme: Theme = {
  colors: {
    background: '#0F172A', // Slate 900 - Oscuro profundo pero no negro
    foreground: '#F8FAFC', // Slate 50

    card: '#1E293B', // Slate 800
    cardForeground: '#F8FAFC',

    primary: '#818CF8', // Indigo 400 - Más brillante para fondo oscuro
    primaryForeground: '#0F172A',

    secondary: '#34D399', // Emerald 400
    secondaryForeground: '#0F172A',

    muted: '#334155', // Slate 700
    mutedForeground: '#94A3B8', // Slate 400

    accent: '#FBBF24', // Amber 400 - Dorado brillante
    accentForeground: '#0F172A',

    destructive: '#F87171', // Rojo claro
    destructiveForeground: '#FFFFFF',

    success: '#34D399', // Emerald 400
    successForeground: '#0F172A',

    warning: '#FBBF24', // Ámbar brillante
    warningForeground: '#0F172A',

    info: '#60A5FA', // Azul claro
    infoForeground: '#0F172A',

    border: '#334155', // Slate 700
    borderLight: '#475569',

    input: '#1E293B',
    inputForeground: '#F8FAFC',

    ring: '#818CF8', // Indigo para focus
  },

  // Spacing, borderRadius, fontSize, fontWeight son iguales en ambos temas
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  fontSize: lightTheme.fontSize,
  fontWeight: lightTheme.fontWeight,

  shadows: {
    // Shadows más sutiles en dark mode
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  animation: lightTheme.animation,
};

// Helper: get theme by name
export const getTheme = (themeName: 'light' | 'dark'): Theme => {
  return themeName === 'dark' ? darkTheme : lightTheme;
};

// Export for backward compatibility
export const theme = lightTheme;
export const colors = lightTheme.colors;
