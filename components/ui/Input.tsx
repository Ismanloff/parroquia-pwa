import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  containerClassName = '',
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`mb-md ${containerClassName}`} style={containerStyle}>
      {label && (
        <Text
          className="text-sm font-medium mb-xs"
          style={{ color: theme.colors.foreground }}
        >
          {label}
        </Text>
      )}

      <TextInput
        className={`
          rounded-md px-md py-sm text-base min-h-[48px]
          ${error ? 'border-2' : 'border'}
        `}
        style={[
          {
            backgroundColor: theme.colors.input,
            borderColor: error
              ? theme.colors.destructive
              : isFocused
              ? theme.colors.ring
              : theme.colors.border,
            color: theme.colors.inputForeground,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.mutedForeground}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />

      {error && (
        <Text
          className="text-xs mt-xs"
          style={{ color: theme.colors.destructive }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
