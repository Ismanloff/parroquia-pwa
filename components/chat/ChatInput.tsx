import React from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Square } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading: boolean;
  keyboardVisible: boolean;
};

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  isLoading,
  keyboardVisible,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Tab bar tiene ~50px de altura en iOS, más el safe area bottom
  const bottomPadding = keyboardVisible
    ? Math.max(insets.bottom, 12)
    : Math.max(insets.bottom + 60, 72); // 60px para tab bar + safe area

  return (
    <View
      className="border-t px-4"
      style={{
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        paddingTop: 12,
        paddingBottom: bottomPadding,
      }}
    >
      <View className="flex-row items-end">
        <TextInput
          className="flex-1 rounded-3xl px-5 py-3 mr-2"
          style={{
            fontSize: 16,
            lineHeight: 20,
            maxHeight: 120,
            backgroundColor: theme.colors.muted,
            color: theme.colors.foreground,
          }}
          placeholder="Mensaje"
          placeholderTextColor={theme.colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={500}
          editable={!isLoading}
          autoCorrect={true}
          autoCapitalize="sentences"
          spellCheck={true}
          returnKeyType="default"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            // No-op en multiline, el usuario usa el botón Send
          }}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!value.trim() || isLoading}
          className={`w-11 h-11 items-center justify-center mb-1 ${
            isLoading ? 'rounded-lg' : 'rounded-full'
          }`}
          style={{
            backgroundColor: value.trim() || isLoading
              ? theme.colors.foreground
              : theme.colors.muted,
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? "Detener" : "Enviar mensaje"}
          accessibilityState={{ disabled: !value.trim() && !isLoading }}
        >
          {isLoading ? (
            <Square size={16} color={theme.colors.background} fill={theme.colors.background} />
          ) : (
            <Send
              size={18}
              color={value.trim() ? theme.colors.background : theme.colors.mutedForeground}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
