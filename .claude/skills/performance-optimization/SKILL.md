# Performance Optimization Skill

## Performance Stack
- **React Query:** Cache inteligente con staleTime/gcTime
- **Zustand:** Estado mínimo y performante
- **Memory Cache:** 43 FAQs precargadas (0ms respuesta)
- **Redis Cache:** Respuestas semánticas cacheadas
- **Lazy Loading:** Componentes y pantallas

## Métricas del Proyecto
- ⚡ Quick endpoint: < 100ms (cache hit)
- ⚡ Full endpoint: < 3s (AI response)
- 💾 Memory cache hit rate: ~60%
- 💾 Redis cache hit rate: ~30%
- 📱 App bundle size: < 50MB

## Cuándo Usar Este Skill
- ✅ Optimizar renders de componentes
- ✅ Mejorar tiempo de respuesta de APIs
- ✅ Reducir bundle size
- ✅ Optimizar queries de base de datos
- ✅ Implementar estrategias de caché

---

## 1. REACT QUERY OPTIMIZATION

### Configuración Óptima
```typescript
// ✅ CORRECTO - app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 1000 * 60 * 5,
      
      // Mantener en memoria 30 minutos
      gcTime: 1000 * 60 * 30,
      
      // Reintentar 2 veces max
      retry: 2,
      
      // Delay entre reintentos
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // No refetch en window focus (móvil)
      refetchOnWindowFocus: false,
      
      // Sí refetch en reconexión
      refetchOnReconnect: true,
      
      // Mostrar data antigua mientras refetch
      refetchOnMount: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Cache Selectivo por Tipo
```typescript
// ✅ CORRECTO - Diferentes staleTime según tipo de dato
export const useDailyContent = () => {
  return useQuery({
    queryKey: ['dailyContent', date],
    queryFn: fetchDailyContent,
    staleTime: 1000 * 60 * 60, // 1 hora - datos que cambian una vez al día
  });
};

export const useCalendarEvents = () => {
  return useQuery({
    queryKey: ['calendarEvents', startDate, endDate],
    queryFn: fetchEvents,
    staleTime: 1000 * 60 * 10, // 10 min - eventos pueden cambiar
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 30, // 30 min - perfil cambia poco
  });
};
```

### Prefetching
```typescript
// ✅ CORRECTO - Prefetch para mejor UX
import { useQueryClient } from '@tanstack/react-query';

export const useCalendarPrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchNextMonth = useCallback((currentMonth: number) => {
    const nextMonth = currentMonth + 1;
    
    queryClient.prefetchQuery({
      queryKey: ['calendarEvents', nextMonth],
      queryFn: () => fetchEventsForMonth(nextMonth),
      staleTime: 1000 * 60 * 10,
    });
  }, [queryClient]);
  
  return { prefetchNextMonth };
};

// Uso en CalendarScreen
const CalendarScreen = () => {
  const { prefetchNextMonth } = useCalendarPrefetch();
  
  // Prefetch cuando el usuario ve el calendario actual
  useEffect(() => {
    prefetchNextMonth(currentMonth);
  }, [currentMonth, prefetchNextMonth]);
};
```

---

## 2. COMPONENT OPTIMIZATION

### React.memo con Comparación Custom
```typescript
// ✅ CORRECTO - Memo solo re-renderiza cuando es necesario
import { memo } from 'react';

interface MessageBubbleProps {
  message: Message;
  onPress?: (id: string) => void;
}

export const MessageBubble = memo<MessageBubbleProps>(
  ({ message, onPress }) => {
    return (
      <TouchableOpacity onPress={() => onPress?.(message.id)}>
        <View className={message.isUser ? 'bg-blue-500' : 'bg-gray-200'}>
          <Text>{message.text}</Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Solo re-renderizar si cambió el mensaje
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.text === nextProps.message.text &&
      prevProps.message.timestamp === nextProps.message.timestamp
    );
  }
);

MessageBubble.displayName = 'MessageBubble';
```

### useCallback y useMemo
```typescript
// ✅ CORRECTO - Memoizar callbacks y valores computados
import { useCallback, useMemo } from 'react';

export const ChatScreen = () => {
  const { messages } = useChatStore();
  
  // Memoizar callback
  const handleSend = useCallback((text: string) => {
    addMessage({
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    });
  }, []); // Sin dependencias = nunca cambia
  
  // Memoizar cálculo costoso
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }, [messages]); // Solo recalcular cuando cambian mensajes
  
  return (
    <MessageList 
      messages={sortedMessages}
      onSend={handleSend}
    />
  );
};
```

### Lazy Loading de Componentes
```typescript
// ✅ CORRECTO - Lazy load componentes pesados
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));

export const Screen = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
};
```

---

## 3. FLATLIST OPTIMIZATION

### FlatList Configurado para Performance
```typescript
// ✅ CORRECTO - FlatList optimizado
import { FlatList } from 'react-native';
import { memo } from 'react';

const MessageItem = memo(({ item }: { item: Message }) => (
  <MessageBubble message={item} />
));

export const MessageList = ({ messages }: { messages: Message[] }) => {
  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => <MessageItem item={item} />}
      keyExtractor={(item) => item.id}
      
      // Optimizaciones clave
      windowSize={10}                    // Solo renderizar 10 items arriba/abajo
      maxToRenderPerBatch={10}           // Renderizar 10 items por batch
      updateCellsBatchingPeriod={50}     // 50ms entre batches
      initialNumToRender={15}            // Renderizar 15 al inicio
      removeClippedSubviews={true}       // Remover items fuera de vista
      
      // Si los items tienen altura fija (MUCHO más rápido)
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
      })}
      
      // Evitar re-renders innecesarios
      extraData={messages.length}
    />
  );
};
```

---

## 4. DUAL CACHE ARCHITECTURE

### Memory Cache (Ultra Rápido)
```typescript
// ✅ CORRECTO - 43 FAQs precargadas en memoria
// backend/app/api/chat/utils/memoryCache.ts

const FAQ_CACHE: FAQ[] = [
  {
    question: '¿Cuál es el horario de misas?',
    answer: 'Lunes a viernes: 7AM y 7PM. Domingos: 8AM, 10AM, 12PM y 6PM.',
    keywords: ['horario', 'misas', 'hora'],
  },
  // ... 42 más
];

export const checkMemoryCache = (query: string): string | null => {
  const normalized = query.toLowerCase();
  
  // Búsqueda O(1) por keywords
  for (const faq of FAQ_CACHE) {
    if (faq.keywords.some(k => normalized.includes(k))) {
      const similarity = calculateSimilarity(normalized, faq.question);
      if (similarity >= 0.85) {
        console.log('💾 Memory cache HIT');
        return faq.answer;
      }
    }
  }
  
  return null;
};

// Ventajas:
// - 0ms latencia (todo en RAM)
// - No requiere red
// - 60% hit rate en producción
```

### Redis Cache (Semántico)
```typescript
// ✅ CORRECTO - Caché distribuido con TTL
// backend/app/api/chat/utils/semanticCache.ts

export const checkSemanticCache = async (
  query: string
): Promise<string | null> => {
  try {
    const cacheKey = normalizeQuery(query);
    
    // Buscar exacta
    let cached = await redis.get(`chat:${cacheKey}`);
    if (cached) {
      console.log('💾 Redis cache HIT (exact)');
      return cached;
    }
    
    // Buscar similar (similarity >= 0.85)
    const pattern = 'chat:*';
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const similarity = calculateSimilarity(cacheKey, key.replace('chat:', ''));
      if (similarity >= 0.85) {
        cached = await redis.get(key);
        if (cached) {
          console.log('💾 Redis cache HIT (similar)');
          return cached;
        }
      }
    }
    
    return null;
  } catch (err) {
    // Fail gracefully
    return null;
  }
};

// Ventajas:
// - Distribuido (múltiples instancias)
// - Búsqueda semántica
// - Auto-expira (TTL 1 hora)
// - 30% hit rate adicional
```

### Estrategia de Cache en Endpoints
```typescript
// ✅ CORRECTO - Quick endpoint con dual cache
export async function POST(req: NextRequest) {
  const { message } = await req.json();
  
  // 1. Memory cache (0ms)
  const memoryResult = checkMemoryCache(message);
  if (memoryResult) {
    return NextResponse.json({
      response: memoryResult,
      cached: true,
      cacheType: 'memory',
      latency: 0,
    });
  }
  
  // 2. Redis cache (~10ms)
  const redisResult = await checkSemanticCache(message);
  if (redisResult) {
    return NextResponse.json({
      response: redisResult,
      cached: true,
      cacheType: 'redis',
      latency: 10,
    });
  }
  
  // 3. OpenAI (~2000ms)
  const aiResponse = await generateQuickResponse(message);
  
  // 4. Cachear para futuros requests
  await addToSemanticCache(message, aiResponse);
  
  return NextResponse.json({
    response: aiResponse,
    cached: false,
    latency: 2000,
  });
}

// Resultado:
// - 90% requests < 100ms (cache)
// - 10% requests < 3s (AI)
```

---

## 5. ZUSTAND OPTIMIZATION

### Estado Mínimo y Selectores
```typescript
// ✅ CORRECTO - Solo almacenar lo necesario
import { create } from 'zustand';

interface ChatStore {
  messages: Message[];
  // NO almacenar cosas derivadas:
  // messageCount: number;  ❌
  // latestMessage: Message; ❌
  
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
}));

// Selectores para evitar re-renders
export const useMessageCount = () => 
  useChatStore((state) => state.messages.length);

export const useLatestMessage = () =>
  useChatStore((state) => state.messages[state.messages.length - 1]);
```

### Persist Solo lo Necesario
```typescript
// ✅ CORRECTO - Persist selectivo
export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      // Solo persistir últimos 50 mensajes
      partialize: (state) => ({
        messages: state.messages.slice(-50),
      }),
    }
  )
);
```

---

## 6. IMAGE OPTIMIZATION

### Expo Image con Caché
```typescript
// ✅ CORRECTO - Usar expo-image con cache
import { Image } from 'expo-image';

export const OptimizedImage = ({ uri }: { uri: string }) => {
  return (
    <Image
      source={{ uri }}
      style={{ width: 200, height: 200 }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk" // Cache en memoria y disco
      placeholder={blurhash}    // Placeholder mientras carga
    />
  );
};
```

---

## 7. BUNDLE SIZE OPTIMIZATION

### Lazy Loading de Librerías
```typescript
// ✅ CORRECTO - Import dinámico de libs pesadas
import { useState } from 'react';

export const PDFViewer = ({ url }: { url: string }) => {
  const [PDF, setPDF] = useState<any>(null);
  
  useEffect(() => {
    // Solo cargar PDF lib cuando se necesite
    import('react-native-pdf').then((module) => {
      setPDF(() => module.default);
    });
  }, []);
  
  if (!PDF) return <LoadingSpinner />;
  
  return <PDF source={{ uri: url }} />;
};
```

### Tree Shaking
```typescript
// ✅ CORRECTO - Import específico
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react-native'; // Solo el ícono que necesitas

// ❌ INCORRECTO
import * as Icons from 'lucide-react-native'; // Importa TODO
```

---

## 8. NETWORK OPTIMIZATION

### Request Batching
```typescript
// ✅ CORRECTO - Combinar requests
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Un solo request para múltiples datos
      const [saint, gospel, events] = await Promise.all([
        fetchSaint(),
        fetchGospel(),
        fetchEvents(),
      ]);
      
      return { saint, gospel, events };
    },
  });
};
```

### Request Debouncing
```typescript
// ✅ CORRECTO - Debounce search
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 500);
  
  const { data } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => search(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });
};
```

---

## 9. BACKEND OPTIMIZATIONS

### Rate Limiting
```typescript
// ✅ CORRECTO - Prevenir abuso
// backend/app/api/chat/utils/rateLimiter.ts

export const rateLimiter = new RateLimiter({
  interval: 60 * 1000,           // 1 minuto
  uniqueTokenPerInterval: 500,    // 500 IPs únicas
  maxRequestsPerToken: 10,        // 10 requests/min por IP
});
```

### Connection Pooling
```typescript
// ✅ CORRECTO - Redis con pool
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  
  // Connection pool
  maxConnections: 10,
  minConnections: 2,
});
```

---

## CHECKLIST

- [ ] ✅ React Query con staleTime apropiado
- [ ] ✅ Componentes pesados con React.memo
- [ ] ✅ Callbacks con useCallback
- [ ] ✅ Cálculos con useMemo
- [ ] ✅ FlatList optimizado (windowSize, getItemLayout)
- [ ] ✅ Memory cache implementado
- [ ] ✅ Redis cache implementado
- [ ] ✅ Lazy loading de componentes pesados
- [ ] ✅ Imágenes con expo-image
- [ ] ✅ Bundle size < 50MB
- [ ] ✅ Rate limiting en APIs
- [ ] ✅ Request debouncing en búsquedas

---

## MÉTRICAS A MONITOREAR

```typescript
// ✅ CORRECTO - Tracking de performance
export const trackPerformance = (metric: string, value: number) => {
  if (__DEV__) {
    console.log(`📊 ${metric}: ${value}ms`);
  }
  
  // Enviar a analytics en producción
  if (!__DEV__) {
    analytics.track(metric, { value });
  }
};

// Uso
const start = Date.now();
const result = await fetchData();
trackPerformance('api_latency', Date.now() - start);
```

---

## COMANDOS

```bash
# Analizar bundle size
npx expo export --dump-sourcemap
npx source-map-explorer bundle.js

# Profile performance
npx react-devtools

# Check cache stats
curl http://localhost:3000/api/chat/cache-stats
```
