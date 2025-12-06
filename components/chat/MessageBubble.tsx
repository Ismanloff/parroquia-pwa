import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
// TEMPORAL: Comentado hasta crear development build
// import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import type {
  Attachment,
  QuickActionsConfig,
  QuickActionButton,
} from '@/types/chat';
import { AttachmentCard } from './AttachmentCard';
import { QuickActionButtons } from './QuickActionButtons';

type MessageBubbleProps = {
  text: string;
  isUser: boolean;
  attachments?: Attachment[] | null;
  quickActions?: QuickActionsConfig | null;
  onQuickAction?: (button: QuickActionButton) => void;
};

// Componente de indicador de "escribiendo..."
const TypingIndicator = () => {
  const [dots, setDots] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text
      className="italic"
      style={{
        color: theme.colors.mutedForeground,
        fontSize: 16,
        lineHeight: 24,
      }}
    >
      Escribiendo{dots}
    </Text>
  );
};

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  text,
  isUser,
  attachments,
  quickActions,
  onQuickAction,
}) => {
  const { theme } = useTheme();

  // Si es un mensaje del asistente y está vacío, mostrar indicador de "escribiendo..."
  const showTypingIndicator = !isUser && !text && !attachments?.length;

  return (
    <View
      // TEMPORAL: Sin animaciones hasta crear development build
      // entering={isUser ? FadeInUp.duration(300).springify() : FadeInDown.duration(400).springify()}
      className={`${
        isUser ? 'max-w-[85%] ml-auto rounded-tr-sm' : 'max-w-[90%] mr-auto rounded-tl-sm'
      } rounded-2xl px-4 py-3 mb-3`}
      style={{
        backgroundColor: isUser ? theme.colors.primary : theme.colors.card,
        shadowColor: theme.shadows.sm.shadowColor,
        shadowOffset: theme.shadows.sm.shadowOffset,
        shadowOpacity: theme.shadows.sm.shadowOpacity,
        shadowRadius: theme.shadows.sm.shadowRadius,
        elevation: theme.shadows.sm.elevation,
      }}
    >
      {isUser ? (
        <Text
          style={{
            color: theme.colors.primaryForeground,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          {text}
        </Text>
      ) : (
        <>
          {showTypingIndicator ? (
            <TypingIndicator />
          ) : text ? (
            <Markdown
              style={{
                body: {
                  color: theme.colors.cardForeground,
                  fontSize: 16,
                  lineHeight: 24,
                },
                paragraph: { marginTop: 0, marginBottom: 8 },
                strong: {
                  fontWeight: '600',
                  color: theme.colors.primary, // Resaltar negritas con color primario
                },
                em: { fontStyle: 'italic' },
                bullet_list: { marginBottom: 8, marginLeft: 0 },
                ordered_list: { marginBottom: 8, marginLeft: 0 },
                list_item: { marginBottom: 4 },
                link: {
                  color: theme.colors.primary,
                  textDecorationLine: 'underline',
                },
                code_inline: {
                  backgroundColor: theme.colors.muted,
                  color: theme.colors.foreground,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontSize: 14,
                },
                code_block: {
                  backgroundColor: theme.colors.muted,
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 14,
                },
              }}
            >
              {text}
            </Markdown>
          ) : null}

          {/* Mostrar attachments si existen */}
          {attachments && attachments.length > 0 && (
            <View className="mt-3 gap-2">
              {attachments.map((attachment, index) => (
                <AttachmentCard key={index} attachment={attachment} />
              ))}
            </View>
          )}

          {/* Mostrar Quick Actions si existen */}
          {quickActions && onQuickAction && (
            <QuickActionButtons
              quickActions={quickActions}
              onActionPress={onQuickAction}
            />
          )}
        </>
      )}
    </View>
  );
};

// Función de comparación para React.memo - Solo re-renderizar si props relevantes cambian
const areEqual = (prevProps: MessageBubbleProps, nextProps: MessageBubbleProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.attachments === nextProps.attachments &&
    prevProps.quickActions === nextProps.quickActions
  );
};

// Exportar componente memoizado para evitar re-renders innecesarios
export const MessageBubble = React.memo(MessageBubbleComponent, areEqual);
