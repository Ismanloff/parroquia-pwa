import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// TEMPORAL: keyboard-controller comentado (requiere native build)
// import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Sparkles, Trash2 } from 'lucide-react-native';
import { MessageList, ChatInput, ChatErrorBoundary } from '@/components/chat';
import { useChat } from '@/hooks/useChat';
import { useKeyboardVisibility } from '@/hooks/useKeyboardVisibility';
import { useChatStore } from '@/stores/chatStore';
import { useTheme } from '@/hooks/useTheme';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase;

const ChatScreen = () => {
  const { theme } = useTheme();
  const { messages, inputText, setInputText, isLoading, streamingStatus, scrollViewRef, handleSend, handleQuickAction } = useChat();
  const { keyboardVisible } = useKeyboardVisibility();
  const clearMessages = useChatStore((state) => state.clearMessages);

  const handleClearChat = () => {
    Alert.alert(
      'Limpiar conversación',
      '¿Estás seguro de que deseas eliminar todos los mensajes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => clearMessages(),
        },
      ]
    );
  };

  if (!API_BASE) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center" style={{ color: theme.colors.mutedForeground }}>
            ⚠️ Configura EXPO_PUBLIC_API_BASE para activar el chat
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-4 py-3 border-b flex-row items-center justify-between" style={{ borderBottomColor: theme.colors.border }}>
        <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.mutedForeground }}>
          Chatbot Parroquial
        </Text>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={handleClearChat}
            className="p-2"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Limpiar conversación"
          >
            <Trash2 size={18} color={theme.colors.mutedForeground} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contenedor principal con KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Lista de mensajes con Error Boundary */}
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Sparkles size={48} color={theme.colors.mutedForeground} strokeWidth={1.5} />
            <Text className="text-center mt-4 text-base" style={{ color: theme.colors.mutedForeground }}>
              Envía un mensaje para comenzar
            </Text>
            <Text className="text-center mt-2 text-sm" style={{ color: theme.colors.muted }}>
              Asistente parroquial con IA ✨
            </Text>
          </View>
        ) : (
          <ChatErrorBoundary>
            <MessageList
              messages={messages}
              isLoading={isLoading}
              streamingStatus={streamingStatus}
              scrollViewRef={scrollViewRef}
              onQuickAction={handleQuickAction}
            />
          </ChatErrorBoundary>
        )}

        {/* Input siempre visible */}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          isLoading={isLoading}
          keyboardVisible={keyboardVisible}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
