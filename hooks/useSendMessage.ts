import { useMutation } from '@tanstack/react-query';
import { debugLogger } from './useDebugLogger';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type SendMessageParams = {
  message: string;
  conversationHistory: Message[];
  useQuickEndpoint?: boolean; // Nuevo parámetro para seleccionar endpoint
};

type SendMessageResponse = {
  message: string;
  attachments?: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'url';
    description: string | null;
  }> | null;
  quickActions?: {
    buttons: Array<{
      emoji: string;
      label: string;
      type: 'message' | 'url';
      action: string;
    }>;
  } | null;
  fromCache?: boolean;
  quick?: boolean; // Indicador si vino del endpoint rápido
  generic?: boolean; // Indicador si es respuesta genérica (sin agente)
};

// Usar fetch() moderno con AbortController (más rápido que XMLHttpRequest + mejor cache)
const sendMessageToAPI = async ({
  message,
  conversationHistory,
  useQuickEndpoint = false,
}: SendMessageParams): Promise<SendMessageResponse> => {
  if (!API_BASE) {
    throw new Error('Backend no configurado');
  }

  // Seleccionar endpoint y timeout según tipo de mensaje
  const endpoint = useQuickEndpoint ? '/api/chat/quick' : '/api/chat/message';
  const timeoutMs = useQuickEndpoint ? 15000 : 60000; // 15s para quick, 60s para full (aumentado de 45s)
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const url = `${API_BASE}${endpoint}`;

  console.log(`\n🆕 ========== NUEVA REQUEST ${requestId} ==========`);
  console.log(`🚀 [React Query] Llamando a ${endpoint}`);
  console.log('📝 Mensaje:', message.substring(0, 100) + (message.length > 100 ? '...' : '')); // ✅ Truncar en consola
  console.log('📚 Historial:', conversationHistory.length, 'mensajes');
  console.log(`⏱️  Timeout: ${timeoutMs / 1000}s`);

  // Log al dashboard (ya sanitizado automáticamente por debugLogger)
  debugLogger.info('Nueva request iniciada', {
    endpoint,
    message, // El debugLogger ya lo sanitiza automáticamente
    historyLength: conversationHistory.length,
    useQuickEndpoint,
  }, requestId);

  // AbortController para implementar timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log('⏳ Iniciando fetch...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // FORZAR que NO use ningún tipo de cache
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // ID único para rastrear esta request específica
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({
        message,
        conversationHistory,
      }),
      signal: controller.signal,
      cache: 'no-store', // Fetch API: desactivar cache completamente
    });

    // Limpiar timeout si la request completó
    clearTimeout(timeoutId);

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Mensajes de error más específicos
      let errorMessage = errorData.error || 'Error desconocido';

      if (response.status === 401) {
        errorMessage = 'Error de autenticación. Por favor, contacta al administrador.';
      } else if (response.status === 429) {
        errorMessage = 'Límite de solicitudes excedido. Por favor, intenta en unos minutos.';
      } else if (response.status === 500) {
        errorMessage = 'Error del servidor. Estamos trabajando para solucionarlo.';
      } else if (response.status === 503) {
        errorMessage = 'Servicio temporalmente no disponible. Intenta más tarde.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`✅ [${requestId}] Respuesta recibida del agente`);
    console.log(`📝 [${requestId}] Mensaje recibido:`, data.message?.substring(0, 100) + '...');
    console.log(`🏷️  [${requestId}] fromCache:`, data.fromCache);
    console.log(`🏷️  [${requestId}] quick:`, data.quick);

    // Log al dashboard
    debugLogger.info('Respuesta recibida', {
      messagePreview: data.message?.substring(0, 100),
      fromCache: data.fromCache,
      quick: data.quick,
      generic: data.generic,
      hasAttachments: !!data.attachments?.length,
      attachmentsCount: data.attachments?.length || 0,
    }, requestId);

    if (!data.message) {
      debugLogger.error('El agente no retornó mensaje', {}, requestId);
      throw new Error('El agente no retornó un mensaje');
    }

    if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
      console.log(`📎 [${requestId}] Attachments incluidos:`, data.attachments.length);
    }

    console.log(`========== FIN REQUEST ${requestId} ==========\n`);
    return data;

  } catch (error: any) {
    clearTimeout(timeoutId);

    // Manejar abort (timeout)
    if (error.name === 'AbortError') {
      const timeoutSeconds = timeoutMs / 1000;
      console.error(`⏱️  Timeout de ${timeoutSeconds}s alcanzado`);
      debugLogger.error(`Timeout alcanzado (${timeoutSeconds}s)`, { error: error.message }, requestId);
      throw new Error(`La solicitud tardó demasiado tiempo (${timeoutSeconds}s)`);
    }

    // Otros errores
    console.error('❌ Error en fetch:', error);
    debugLogger.error('Error en fetch', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 200),
    }, requestId);
    throw new Error(error.message || 'Error de red al conectar con el servidor');
  }
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: sendMessageToAPI,
    // NO retry: cada mensaje es único, no queremos duplicar requests
    // Ya configurado globalmente en QueryClient (retry: 0, gcTime: 0)
    onError: (error) => {
      console.error('❌ [React Query] Error en mutation:', error);
    },
    onSuccess: (data) => {
      console.log('✅ [React Query] Mutation exitosa');
      if (data.fromCache) {
        console.log('⚡ Respuesta servida desde cache del backend');
      }
    },
  });
};
