import { useRef, useState } from 'react';
import { FlatList, Linking } from 'react-native';
import { useChatStore } from '@/stores/chatStore';
import { useStreamingChat } from './useStreamingChat';
import { useIntelligentDetector } from './useIntelligentDetector';
import type { Message, QuickActionButton } from '@/types/chat';

/**
 * Hook que maneja el chat usando Zustand store + Streaming
 *
 * ARQUITECTURA OPTIMIZADA 2025:
 * - Detector simplificado: Calendar vs Pinecone (solo para analytics)
 * - Todo usa STREAMING: Pinecone (0.3s) + Agent + Streaming para respuestas naturales
 * - Sin cache: Pinecone es rápido + streaming oculta latencia
 * - Auto-scroll manejado en MessageList.tsx para mejor compatibilidad iOS
 */
export const useChat = () => {
  const scrollViewRef = useRef<FlatList<Message>>(null);
  const [streamingStatus, setStreamingStatus] = useState<'searching' | null>(null);

  // Función helper para scroll - Single RAF es suficiente en React Native moderno
  const scrollToEnd = (animated = true) => {
    requestAnimationFrame(() => {
      const ref = scrollViewRef.current as any;
      if (ref?.scrollToEnd) {
        ref.scrollToEnd({ animated });
      } else if (ref?.scrollToOffset) {
        ref.scrollToOffset({ offset: 999999, animated });
      }
    });
  };

  // Función para scroll al mensaje del usuario (lo muestra arriba del todo)
  const scrollToUserMessage = () => {
    requestAnimationFrame(() => {
      const ref = scrollViewRef.current as any;
      const totalMessages = messages.length + 1; // +1 porque acabamos de agregar el mensaje del usuario

      if (ref?.scrollToIndex && totalMessages > 0) {
        try {
          // viewPosition: 0 = arriba del todo, 1 = abajo del todo
          ref.scrollToIndex({
            index: totalMessages - 1, // Último mensaje (el del usuario)
            animated: true,
            viewPosition: 0 // Lo pone arriba del todo
          });
        } catch (e) {
          // Fallback si scrollToIndex falla
          scrollToEnd(true);
        }
      } else {
        scrollToEnd(true);
      }
    });
  };

  // NO scroll automático al abrir teclado (removido para evitar interferencias)

  // Estado de Zustand
  const messages = useChatStore((state) => state.messages);
  const inputText = useChatStore((state) => state.inputText);
  const setInputText = useChatStore((state) => state.setInputText);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);

  // Streaming optimizado con Pinecone + Agent
  const { sendStreamingMessage, isStreaming } = useStreamingChat();

  // Detector simplificado (Calendar vs Pinecone) - solo para analytics
  const { detectMessageType, isDetecting } = useIntelligentDetector();

  /**
   * Enviar mensaje al chat.
   * @param messageOverride - Mensaje opcional para enviar directamente (sin usar inputText)
   *                          Útil para auto-envío desde Quick Actions sin mostrar en input
   */
  const handleSend = async (messageOverride?: string) => {
    // Si se pasa mensaje override válido (string), usarlo; sino usar inputText
    const messageToSend = (messageOverride && typeof messageOverride === 'string')
      ? messageOverride.trim()
      : inputText.trim();
    if (!messageToSend || isStreaming || isDetecting) return;

    console.log('📤 Enviando mensaje:', messageToSend);

    // 🧠 DETECTOR SIMPLIFICADO: Solo para analytics (todo va por streaming)
    const recentMessages = messages.slice(-4).map(m => ({
      role: m.isUser ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));

    const detection = await detectMessageType(messageToSend, {
      recentMessages,
    });

    console.log(`🧠 Tipo de query: ${detection.reason}`);

    // IDs para los mensajes optimistas
    const userMessageId = Date.now().toString();
    const assistantMessageId = (Date.now() + 1).toString();

    // 1️⃣ OPTIMISTIC UPDATE: Agregar mensaje del usuario INSTANTÁNEAMENTE
    const userMessage: Message = {
      id: userMessageId,
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    addMessage(userMessage);

    // Solo limpiar input si estamos usando el texto del input (no override válido)
    if (!(messageOverride && typeof messageOverride === 'string')) {
      setInputText('');
    }

    // Scroll para mostrar el mensaje del usuario arriba del todo
    scrollToUserMessage();

    // 2️⃣ OPTIMISTIC UPDATE: Crear mensaje vacío del asistente (placeholder)
    const emptyAssistantMessage: Message = {
      id: assistantMessageId,
      text: '',
      isUser: false,
      timestamp: new Date(),
    };

    addMessage(emptyAssistantMessage);

    // 3️⃣ Preparar historial de conversación (sin incluir los mensajes optimistas)
    const conversationHistory = messages
      .slice(-8) // Últimos 8 mensajes
      .map((m) => ({
        role: m.isUser ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    // 4️⃣ STREAMING OPTIMIZADO: Pinecone (0.3s) + Agent + Streaming
    console.log('⚡🌊 Usando STREAMING con Pinecone + Agent...');

    let accumulatedText = ''; // Acumular texto durante el streaming

    await sendStreamingMessage({
      message: messageToSend,
      conversationHistory,
      endpoint: '/api/chat/message-stream', // Streaming con Pinecone + Agent
      onChunk: (chunk: string) => {
        // Acumular y actualizar mensaje del asistente con cada chunk
        accumulatedText += chunk;
        updateMessage(assistantMessageId, {
          text: accumulatedText,
        });
      },
      onStatus: (status) => {
        // Actualizar estado de status para mostrar indicadores
        setStreamingStatus(status);
      },
      onComplete: (fullText: string, attachments?: any[] | null, quickActions?: any | null) => {
        console.log('✅ Streaming completado');

        // Limpiar status
        setStreamingStatus(null);

        // Preparar updates para el mensaje
        const messageUpdates: any = {
          text: accumulatedText,
        };

        // Agregar attachments si los hay
        if (attachments && attachments.length > 0) {
          console.log(`📎 Agregando ${attachments.length} attachments al mensaje`);
          messageUpdates.attachments = attachments;
        }

        // Agregar quickActions si los hay
        if (quickActions && quickActions.buttons && quickActions.buttons.length > 0) {
          console.log(`🎯 Agregando ${quickActions.buttons.length} Quick Actions al mensaje`);
          messageUpdates.quickActions = quickActions;
        }

        // Actualizar mensaje con todo
        updateMessage(assistantMessageId, messageUpdates);
      },
      onError: (error: Error) => {
        console.error('❌ Error en streaming:', error);

        // Limpiar status
        setStreamingStatus(null);

        updateMessage(assistantMessageId, {
          text: `❌ Error: ${error.message || 'No se pudo enviar el mensaje'}. Toca para reintentar.`,
        });
      },
    });
  };

  /**
   * 🎯 Handler para Quick Actions (Botones Inteligentes)
   *
   * Maneja el click en botones contextuales:
   * - type: 'url' → Abre URL externa (ej: Typeform inscripción)
   * - type: 'message' → Auto-envía mensaje programáticamente
   *
   * Anti-spam: Elimina botones del mensaje después de usarlos
   */
  const handleQuickAction = async (button: QuickActionButton) => {
    console.log('🎯 Quick Action clickeado:', button);

    // Anti-spam: Encontrar el mensaje que tiene estos botones y eliminarlos
    const messageWithButtons = messages.find(m =>
      m.quickActions && m.quickActions.buttons.some(b =>
        b.emoji === button.emoji && b.label === button.label
      )
    );

    if (messageWithButtons) {
      updateMessage(messageWithButtons.id, {
        quickActions: null, // Remover botones para evitar spam
      });
      console.log('🚫 Botones removidos del mensaje para evitar spam');
    }

    // Ejecutar acción según tipo
    if (button.type === 'url') {
      // Abrir URL externa
      try {
        const canOpen = await Linking.canOpenURL(button.action);
        if (canOpen) {
          await Linking.openURL(button.action);
          console.log('🌐 URL abierta:', button.action);
        } else {
          console.error('❌ No se puede abrir URL:', button.action);
        }
      } catch (error) {
        console.error('❌ Error abriendo URL:', error);
      }
    } else if (button.type === 'message') {
      // Auto-enviar mensaje DIRECTAMENTE sin mostrar en input
      console.log('💬 Auto-enviando mensaje desde Quick Action:', button.action);
      await handleSend(button.action);
    }
  };

  return {
    messages,
    inputText,
    setInputText,
    isLoading: isStreaming || isDetecting, // Loading cuando streaming o detectando
    streamingStatus, // Estado de progreso: 'searching' | 'writing' | null
    scrollViewRef,
    handleSend,
    handleQuickAction, // Exportar handler de Quick Actions
  };
};
