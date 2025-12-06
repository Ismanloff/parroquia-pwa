import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  // Variant class names
  const variantClasses = {
    primary: 'bg-primary active:opacity-80',
    secondary: 'bg-secondary active:opacity-80',
    outline: 'bg-transparent border-2 border-primary active:bg-primary/10',
    ghost: 'bg-transparent active:bg-muted',
    destructive: 'bg-destructive active:opacity-80',
  };

  // Size class names
  const sizeClasses = {
    sm: 'px-md py-xs min-h-[36px]',
    md: 'px-lg py-sm min-h-[48px]',
    lg: 'px-xl py-md min-h-[56px]',
  };

  // Text variant class names
  const textVariantClasses = {
    primary: 'text-primary-foreground',
    secondary: 'text-secondary-foreground',
    outline: 'text-primary',
    ghost: 'text-primary',
    destructive: 'text-destructive-foreground',
  };

  // Text size class names
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // Spinner color según variant
  const spinnerColor = variant === 'outline' || variant === 'ghost'
    ? theme.colors.primary
    : theme.colors.primaryForeground;

  return (
    <TouchableOpacity
      testID={testID}
      className={`
        rounded-md items-center justify-center flex-row
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      style={style}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          className={`
            font-semibold
            ${textVariantClasses[variant]}
            ${textSizeClasses[size]}
          `}
          style={textStyle}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
