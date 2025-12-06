import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ message, size = 'large' }) => {
  const { theme } = useTheme();

  return (
    <View className="flex-1 justify-center items-center px-xl">
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text
          className="mt-md text-base text-center"
          style={{ color: theme.colors.mutedForeground }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};
