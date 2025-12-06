export const theme = {
  colors: {
    primary: '#4F46E5', // Indigo 600 - Más elegante y moderno que el azul estándar
    secondary: '#059669', // Emerald 600 - Verde más profundo
    accent: '#D97706', // Amber 600 - Toque dorado para resaltar
    background: '#F8FAFC', // Slate 50 - Fondo muy limpio
    surface: '#ffffff',
    white: '#ffffff',
    text: '#1e293b', // Slate 800 - Texto oscuro pero no negro puro (más suave)
    textSecondary: '#64748b', // Slate 500
    textLight: '#94a3b8', // Slate 400
    muted: '#64748b',
    border: '#e2e8f0', // Slate 200
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
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
  },
};

export const colors = theme.colors;