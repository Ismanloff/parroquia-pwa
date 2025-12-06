import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { QuickActionButton, QuickActionsConfig } from '@/types/chat';

type QuickActionButtonsProps = {
  quickActions: QuickActionsConfig;
  onActionPress: (button: QuickActionButton) => void;
};

/**
 * Componente de Botones Inteligentes (Quick Actions)
 *
 * Renderiza botones contextuales después de respuestas breves desde cache.
 * Permite al usuario:
 * - Ver más información (auto-envía mensaje)
 * - Inscribirse (abre URL de Typeform)
 * - Ver requisitos, horarios, ubicación, etc.
 */
export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  quickActions,
  onActionPress,
}) => {
  const { theme } = useTheme();

  if (!quickActions || !quickActions.buttons || quickActions.buttons.length === 0) {
    return null;
  }

  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {quickActions.buttons.map((button, index) => (
        <TouchableOpacity
          key={`${button.emoji}-${index}`}
          onPress={() => onActionPress(button)}
          className="rounded-full px-4 py-2.5 flex-row items-center gap-2"
          style={{
            backgroundColor: theme.colors.primary,
            // Sombra suave
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          activeOpacity={0.7}
        >
          {/* Emoji */}
          <Text style={{ fontSize: 16 }}>{button.emoji}</Text>

          {/* Label */}
          <Text
            style={{
              color: theme.colors.primaryForeground,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            {button.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
