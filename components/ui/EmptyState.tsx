import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();

  return (
    <View className="flex-1 justify-center items-center px-xl">
      {icon && (
        <View className="mb-md" testID="empty-state-icon">
          {icon}
        </View>
      )}

      <Text
        className="text-xl font-semibold text-center mb-sm"
        style={{ color: theme.colors.foreground }}
      >
        {title}
      </Text>

      {message && (
        <Text
          className="text-base text-center mb-lg"
          style={{ color: theme.colors.mutedForeground }}
        >
          {message}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="md"
          style={{ marginTop: theme.spacing.md }}
        />
      )}
    </View>
  );
};
