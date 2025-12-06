/**
 * ThemeWrapper
 *
 * Component que aplica estilos dinámicos según el tema activo.
 * Usa style inline porque NativeWind en React Native no soporta
 * dark mode con clases automáticamente (solo en web).
 *
 * Uso:
 * <ThemeWrapper bg="background" className="flex-1 p-4">
 *   <Text>Contenido</Text>
 * </ThemeWrapper>
 */

import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type ThemeColor = keyof typeof import('@/constants/themes').lightTheme.colors;

interface ThemeWrapperProps extends ViewProps {
  bg?: ThemeColor;
  borderColor?: ThemeColor;
  children: React.ReactNode;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({
  bg,
  borderColor,
  children,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const dynamicStyle: ViewStyle = {
    ...(bg && { backgroundColor: theme.colors[bg] }),
    ...(borderColor && { borderColor: theme.colors[borderColor] }),
  };

  return (
    <View style={[dynamicStyle, style]} {...props}>
      {children}
    </View>
  );
};
