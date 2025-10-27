import { useState, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { Message, QuickActionButton } from '@/types/chat';

export function useChat() {
  const {
    messages,
    inputText,
    setInputText,
    addMessage,
    updateMessage,
    clearMessages,
    removeQuickActions,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<
    'searching' | 'writing' | null
  >(null);

  const handleSend = useCallback(
    async (messageOverride?: string) => {
      const textToSend = messageOverride || inputText.trim();

      if (!textToSend || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: textToSend,
        timestamp: new Date(),
      };

      addMessage(userMessage);
      setInputText('');
      setIsLoading(true);

      // Crear mensaje del asistente vacío (optimistic update)
      const assistantMessageId = `${Date.now()}-assistant`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      addMessage(assistantMessage);

      try {
        // Llamar al endpoint de streaming
        const response = await fetch('/api/chat/message-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: textToSend,
            conversationHistory: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

      if (!response.ok) {
        throw new Error('Error en la respuesta');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No se pudo leer la respuesta');
      }

      let accumulatedText = '';
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Detectar tipo de evento
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }

          // Procesar data
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);

                // Manejar diferentes tipos de eventos
                if (currentEvent === 'status') {
                  setStreamingStatus(data.status);
                  currentEvent = '';
                } else if (currentEvent === 'done') {
                  // Evento done incluye attachments y quickActions
                  updateMessage(assistantMessageId, {
                    attachments: data.attachments || null,
                    quickActions: data.quickActions || null,
                  });
                  setStreamingStatus(null);
                  currentEvent = '';
                } else {
                  // Es un chunk de texto (sin event específico)
                  if (typeof data === 'string') {
                    accumulatedText += data;

                    updateMessage(assistantMessageId, {
                      content: accumulatedText,
                    });
                  }
                }
            } catch (e) {
              // Si no es JSON válido, ignorar
              console.debug('No se pudo parsear:', dataStr);
            }
          }
        }
      }
      } catch (error) {
        console.error('Error en el chat:', error);

        // Mostrar mensaje de error
        updateMessage(assistantMessageId, {
          content: '⚠️ Error al procesar tu mensaje. Intenta de nuevo.',
        });
      } finally {
        setIsLoading(false);
        setStreamingStatus(null);
      }
    },
    [
      inputText,
      isLoading,
      messages,
      addMessage,
      updateMessage,
      setInputText,
    ]
  );

  const handleQuickAction = useCallback(
    (button: QuickActionButton, messageId: string) => {
      if (button.type === 'url') {
        // Abrir URL en nueva pestaña
        window.open(button.action, '_blank');
      } else if (button.type === 'message') {
        // Auto-enviar mensaje
        handleSend(button.action);
      }

      // Eliminar quick actions después de usarlas (anti-spam)
      removeQuickActions(messageId);
    },
    [handleSend, removeQuickActions]
  );

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    streamingStatus,
    handleSend,
    handleQuickAction,
    clearMessages,
  };
}
