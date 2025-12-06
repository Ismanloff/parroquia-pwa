/**
 * Hook para manejar historial de mensajes con paginación infinita
 * Basado en: guia/professional_react_query_streaming.tsx
 *
 * Carga mensajes del AsyncStorage por páginas para mejor rendimiento
 * con conversaciones largas.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/types/chat';

const PAGE_SIZE = 20; // Mensajes por página

interface MessagePage {
  messages: Message[];
  nextCursor: number | null;
  hasMore: boolean;
}

/**
 * Obtiene una página de mensajes del store de Zustand
 */
const fetchMessagesPage = async (
  allMessages: Message[],
  cursor: number = 0
): Promise<MessagePage> => {
  // Simular un pequeño delay para sentir la paginación (opcional)
  await new Promise(resolve => setTimeout(resolve, 100));

  // Los mensajes están ordenados cronológicamente (más antiguos primero)
  // Queremos cargar desde el más reciente hacia atrás
  const totalMessages = allMessages.length;
  const startIndex = Math.max(0, totalMessages - cursor - PAGE_SIZE);
  const endIndex = totalMessages - cursor;

  const messagesInPage = allMessages.slice(startIndex, endIndex);
  const hasMore = startIndex > 0;
  const nextCursor = hasMore ? cursor + PAGE_SIZE : null;

  return {
    messages: messagesInPage.reverse(), // Revertir para mostrar más recientes primero
    nextCursor,
    hasMore,
  };
};

/**
 * Hook personalizado para infinite scroll del historial de mensajes
 */
export const useInfiniteMessages = () => {
  const allMessages = useChatStore((state) => state.messages);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['messages-infinite', allMessages.length], // Re-query cuando cambia el total
    queryFn: ({ pageParam = 0 }) => fetchMessagesPage(allMessages, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });

  // Flatten todas las páginas en un array único
  const messages = data?.pages.flatMap((page) => page.messages) || [];

  return {
    messages,
    loadMoreMessages: fetchNextPage,
    hasMoreMessages: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isInitialLoading: isLoading,
    error,
    totalMessages: allMessages.length,
  };
};
