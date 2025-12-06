import React from 'react';
import { View, FlatList, ActivityIndicator, Text, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { MessageBubble } from './MessageBubble';
import { useTheme } from '@/hooks/useTheme';
import type { Message, QuickActionButton } from '@/types/chat';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  streamingStatus?: 'searching' | null; // Estado de progreso (solo "Buscando datos...")
  scrollViewRef: React.RefObject<FlatList<Message> | null>;
  // Quick Actions callback
  onQuickAction?: (button: QuickActionButton) => void;
  // Infinite scroll props
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  streamingStatus,
  scrollViewRef,
  onQuickAction,
  onLoadMore,
  hasMoreMessages = false,
  isLoadingMore = false,
}) => {
  const { theme } = useTheme();

  // Rastrear si el usuario está en el fondo de la lista
  const atBottomRef = React.useRef(true);

  // Estado para mostrar/ocultar el botón de scroll to bottom
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  // Throttle para onScroll - evita ejecutar 60 veces por segundo
  const lastScrollTime = React.useRef(0);
  const SCROLL_THROTTLE = 100; // ms

  // Función helper para hacer scroll - Sin RAF porque ya se ejecuta en onContentSizeChange
  const scrollToEndSoon = React.useCallback((animated = true) => {
    const ref = scrollViewRef.current as any;
    if (ref?.scrollToEnd) {
      ref.scrollToEnd({ animated });
    } else if (ref?.scrollToOffset) {
      ref.scrollToOffset({ offset: 999999, animated });
    }
  }, [scrollViewRef]);

  // Detectar si el usuario está cerca del fondo - Throttled para performance
  const onScroll = React.useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const now = Date.now();
    if (now - lastScrollTime.current < SCROLL_THROTTLE) return;
    lastScrollTime.current = now;

    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const threshold = 100; // Aumentado a 100px para mejor detección
    const isAtBottom = contentSize.height - contentOffset.y - layoutMeasurement.height <= threshold;

    atBottomRef.current = isAtBottom;

    // Mostrar botón solo si NO está al final Y hay mensajes
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  // Auto-scroll mejorado: Cuando se agrega un nuevo mensaje
  React.useEffect(() => {
    if (messages.length > 0 && atBottomRef.current) {
      // Pequeño delay para que el mensaje se renderice primero
      setTimeout(() => scrollToEndSoon(true), 100);
    }
  }, [messages.length, scrollToEndSoon]);

  // Memoizar renderItem para evitar re-renders innecesarios
  const renderItem = React.useCallback(({ item: message }: { item: Message }) => (
    <View className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}>
      <MessageBubble
        text={message.text}
        isUser={message.isUser}
        attachments={message.attachments}
        quickActions={message.quickActions}
        onQuickAction={onQuickAction}
      />
    </View>
  ), [onQuickAction]);

  // Extraer IDs para keyExtractor
  const keyExtractor = React.useCallback((item: Message) => item.id, []);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={scrollViewRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // Scroll anchor: elemento invisible que mantiene el scroll al final durante streaming
        ListFooterComponent={
          streamingStatus === 'searching' ? (
            <View className="mb-2 items-start">
              <View
                className="px-4 py-2 rounded-2xl flex-row items-center gap-2"
                style={{
                  backgroundColor: theme.isDark ? '#2A2A2A' : '#F3F4F6',
                }}
              >
                <ActivityIndicator size="small" color={theme.colors.mutedForeground} />
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 14 }}>
                  Buscando datos...
                </Text>
              </View>
            </View>
          ) : messages.length > 0 && messages[messages.length - 1] && !messages[messages.length - 1].isUser ? (
            <View style={{ height: 1 }} />
          ) : null
        }
        // Sin inverted, onEndReached se activa al final de la lista (no necesitamos cargar más mensajes allí)
        // onEndReached={() => {}}
        // onEndReachedThreshold={0.5}
        // inverted removido - ahora muestra mensajes en orden normal (antiguos arriba, nuevos abajo)
        onScroll={onScroll}
        scrollEventThrottle={16} // Para mejor responsividad del botón
        onContentSizeChange={() => {
          // FORZAR scroll durante streaming: si el último mensaje es del bot, hacer scroll SIEMPRE
          const lastMessage = messages[messages.length - 1];
          const isStreaming = lastMessage && !lastMessage.isUser;

          if (isStreaming) {
            // Durante streaming: scroll INSTANTÁNEO sin animación para fluidez máxima
            scrollToEndSoon(false);
          } else if (atBottomRef.current) {
            // Fuera de streaming: scroll con animación suave
            scrollToEndSoon(true);
          }
        }}
        onLayout={() => {
          // Scroll inicial solo cuando se monta por primera vez
          if (messages.length > 0 && !hasMoreMessages) {
            scrollToEndSoon(false);
          }
        }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={21}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      />

      {/* Botón flotante "Scroll to Bottom" - Centrado como WhatsApp */}
      {showScrollButton && (
        <TouchableOpacity
          onPress={() => {
            scrollToEndSoon(true);
            setShowScrollButton(false);
          }}
          style={[
            styles.scrollButton,
            {
              backgroundColor: theme.isDark ? '#374151' : '#F3F4F6', // Gris como en la foto
              shadowColor: '#000',
            },
          ]}
          activeOpacity={0.8}
          accessibilityLabel="Ir al final"
          accessibilityRole="button"
        >
          <ChevronDown
            size={24}
            color={theme.isDark ? '#9CA3AF' : '#6B7280'} // Gris medio
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollButton: {
    position: 'absolute',
    bottom: 24,
    // Centrado horizontalmente
    left: '50%',
    marginLeft: -24, // La mitad del ancho (48/2) para centrar perfectamente
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra para iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Sombra para Android
    elevation: 8,
  },
});
