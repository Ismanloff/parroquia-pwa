import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  className = '',
}) => {
  const { theme } = useTheme();

  // Variantes de sombra según el tipo de card
  const shadowStyle = variant === 'elevated' ? theme.shadows.lg : theme.shadows.md;

  // Clases base + variantes
  const baseClasses = 'rounded-lg p-md';
  const variantClasses = {
    default: '',
    elevated: '',
    outlined: 'border border-border',
  };

  return (
    <View
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={[
        { backgroundColor: theme.colors.card },
        variant !== 'outlined' && shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};
