# OpenAI Chatbot Skill

## Stack de Chat
- **OpenAI SDK:** @ai-sdk/react 2.0.71 + ai 5.0.71
- **Arquitectura:** Dual endpoints (Quick + Full)
- **Caché:** Memory Cache (43 FAQs) + Redis Cloud (Semantic)
- **Streaming:** SSE con react-native-sse 1.2.1
- **State:** Zustand 5.0.8 + React Query 5.90.3

## Arquitectura Única del Proyecto

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       v
┌──────────────────┐
│ useQuickDetector │ ← Analiza si es FAQ o query compleja
└──────┬───────────┘
       │
       ├─ Quick? ──────> /api/chat/quick ──> Memory Cache (43 FAQs)
       │                                  └──> Redis Cache (semántico)
       │
       └─ Full? ───────> /api/chat/message ──> OpenAI Agent + Tools
                                                 ├─ Calendar Tool
                                                 └─ Rate Limiter
```

## Cuándo Usar Este Skill
- ✅ Implementar nuevos endpoints de chat
- ✅ Añadir nuevos tools al agente
- ✅ Optimizar caché semántico
- ✅ Manejar streaming de respuestas
- ✅ Debuggear issues de chat

---

## 1. ARQUITECTURA DUAL DE ENDPOINTS

### Quick Endpoint (FAQs Cacheadas)
```typescript
// ✅ CORRECTO - backend/app/api/chat/quick/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkMemoryCache } from '../utils/memoryCache';
import { checkSemanticCache, addToSemanticCache } from '../utils/semanticCache';
import { generateQuickResponse } from '../utils/openai';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // 1. Buscar en Memory Cache primero (43 FAQs precargadas)
    const memoryCached = checkMemoryCache(message);
    if (memoryCached) {
      return NextResponse.json({
        response: memoryCached,
        cached: true,
        cacheType: 'memory',
      });
    }
    
    // 2. Buscar en Redis Cache (semántico)
    const redisCached = await checkSemanticCache(message);
    if (redisCached) {
      return NextResponse.json({
        response: redisCached,
        cached: true,
        cacheType: 'redis',
      });
    }
    
    // 3. Generar respuesta con OpenAI (simple, sin tools)
    const response = await generateQuickResponse(message);
    
    // 4. Cachear en Redis para futuras queries similares
    await addToSemanticCache(message, response);
    
    return NextResponse.json({
      response,
      cached: false,
    });
  } catch (error) {
    console.error('Error in quick endpoint:', error);
    return NextResponse.json(
      { error: 'Error generando respuesta rápida' },
      { status: 500 }
    );
  }
}
```

### Full Endpoint (Agente con Tools)
```typescript
// ✅ CORRECTO - backend/app/api/chat/message/route.ts
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { calendarTool } from '../tools/calendarTool';
import { rateLimiter } from '../utils/rateLimiter';
import { structuredLogger } from '../utils/structuredLogger';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    // 1. Rate limiting
    const allowed = await rateLimiter.check(req);
    if (!allowed) {
      return new Response('Too many requests', { status: 429 });
    }
    
    const { messages, userId } = await req.json();
    
    // 2. Log estructurado
    structuredLogger.log({
      type: 'chat_request',
      requestId,
      userId,
      messageCount: messages.length,
    });
    
    // 3. Streaming con tools
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages,
      tools: {
        getCalendarEvents: calendarTool,
      },
      maxSteps: 5,
      onFinish: async ({ response }) => {
        structuredLogger.log({
          type: 'chat_response',
          requestId,
          tokenCount: response.usage?.totalTokens,
        });
      },
    });
    
    return result.toDataStreamResponse();
  } catch (error) {
    structuredLogger.error({
      type: 'chat_error',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return new Response('Error generando respuesta', { status: 500 });
  }
}
```

---

## 2. SISTEMA DE CACHÉ DUAL

### Memory Cache (43 FAQs Precargadas)
```typescript
// ✅ CORRECTO - backend/app/api/chat/utils/memoryCache.ts
interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
}

const FAQ_CACHE: FAQ[] = [
  {
    question: '¿Cuál es el horario de misas?',
    answer: 'Las misas son de lunes a viernes a las 7:00 AM y 7:00 PM. Los domingos a las 8:00 AM, 10:00 AM, 12:00 PM y 6:00 PM.',
    keywords: ['horario', 'misas', 'hora', 'cuando'],
  },
  {
    question: '¿Dónde está ubicada la parroquia?',
    answer: 'La parroquia está ubicada en Calle Principal #123, Centro Histórico.',
    keywords: ['ubicacion', 'direccion', 'donde', 'esta'],
  },
  // ... 41 FAQs más
];

export const checkMemoryCache = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Buscar por similitud de keywords
  const match = FAQ_CACHE.find(faq =>
    faq.keywords.some(keyword => normalizedQuery.includes(keyword))
  );
  
  if (match) {
    // Calcular score de similitud
    const score = calculateSimilarity(normalizedQuery, match.question);
    if (score >= 0.85) {
      return match.answer;
    }
  }
  
  return null;
};

const calculateSimilarity = (str1: string, str2: string): number => {
  // Implementación de Levenshtein distance o similar
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};
```

### Redis Cache (Semántico)
```typescript
// ✅ CORRECTO - backend/app/api/chat/utils/semanticCache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

const CACHE_TTL = 60 * 60; // 1 hora
const SIMILARITY_THRESHOLD = 0.85;

// Exclusiones de calendario
const CALENDAR_KEYWORDS = [
  'calendario', 'evento', 'fecha', 'cuando', 'dia', 'mes',
  'reunión', 'actividad', 'hoy', 'mañana', 'próximo',
];

const shouldExcludeFromCache = (query: string): boolean => {
  const normalized = query.toLowerCase();
  return CALENDAR_KEYWORDS.some(keyword => normalized.includes(keyword));
};

export const checkSemanticCache = async (
  query: string
): Promise<string | null> => {
  if (shouldExcludeFromCache(query)) {
    return null;
  }
  
  try {
    const cacheKey = `chat:${normalizeQuery(query)}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log('✅ Cache hit (Redis):', query);
      return cached;
    }
    
    // Buscar queries similares
    const pattern = 'chat:*';
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const cachedQuery = key.replace('chat:', '');
      const similarity = calculateSimilarity(
        normalizeQuery(query),
        cachedQuery
      );
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        const response = await redis.get(key);
        if (response) {
          console.log('✅ Cache hit (similar):', cachedQuery);
          return response;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Redis error:', error);
    return null; // Fail gracefully
  }
};

export const addToSemanticCache = async (
  query: string,
  response: string
): Promise<void> => {
  if (shouldExcludeFromCache(query)) {
    return;
  }
  
  try {
    const cacheKey = `chat:${normalizeQuery(query)}`;
    await redis.setex(cacheKey, CACHE_TTL, response);
    console.log('💾 Cached:', query);
  } catch (error) {
    console.error('Error caching:', error);
  }
};

const normalizeQuery = (query: string): string => {
  return query
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!.,;]/g, '')
    .replace(/\s+/g, '-');
};
```

---

## 3. QUICK DETECTOR (Frontend)

### Detector de Tipo de Query
```typescript
// ✅ CORRECTO - hooks/useQuickDetector.ts
const FAQ_PATTERNS = [
  /horarios?/i,
  /misas?/i,
  /ubicaci[óo]n/i,
  /direcci[óo]n/i,
  /contacto/i,
  /tel[ée]fono/i,
  /confesiones?/i,
  /bautismo/i,
  /matrimonio/i,
  /d[óo]nde/i,
  /cu[áa]ndo/i,
  /qui[ée]n/i,
];

const COMPLEX_PATTERNS = [
  /explica/i,
  /c[óo]mo/i,
  /por qu[ée]/i,
  /diferencia/i,
  /relaci[óo]n/i,
  /compara/i,
  /analiza/i,
];

const CALENDAR_PATTERNS = [
  /calendario/i,
  /evento/i,
  /pr[óo]ximo/i,
  /hoy/i,
  /ma[ñn]ana/i,
  /semana/i,
  /mes/i,
];

export const useQuickDetector = () => {
  const detectType = (message: string): 'quick' | 'full' => {
    // Siempre usar full para queries de calendario
    if (CALENDAR_PATTERNS.some(pattern => pattern.test(message))) {
      return 'full';
    }
    
    // Si coincide con FAQ pattern, es quick
    if (FAQ_PATTERNS.some(pattern => pattern.test(message))) {
      return 'quick';
    }
    
    // Si es complejo, usar full
    if (COMPLEX_PATTERNS.some(pattern => pattern.test(message))) {
      return 'full';
    }
    
    // Por defecto, si es corto (< 50 chars) asumir quick
    return message.length < 50 ? 'quick' : 'full';
  };
  
  return { detectType };
};
```

---

## 4. HOOK DE ENVÍO DE MENSAJES

### useSendMessage con Dual Endpoints
```typescript
// ✅ CORRECTO - hooks/useSendMessage.ts
import { useMutation } from '@tanstack/react-query';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;
const QUICK_TIMEOUT = 15000; // 15s
const FULL_TIMEOUT = 60000; // 60s

interface SendMessageParams {
  message: string;
  type: 'quick' | 'full';
  userId?: string;
}

export const useSendMessage = () => {
  return useMutation({
    mutationFn: async ({ message, type, userId }: SendMessageParams) => {
      const endpoint = type === 'quick' ? '/api/chat/quick' : '/api/chat/message';
      const timeout = type === 'quick' ? QUICK_TIMEOUT : FULL_TIMEOUT;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({ message, userId }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Demasiadas solicitudes. Intenta en un momento.');
          }
          throw new Error(`Error ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout: La solicitud tardó demasiado');
        }
        throw error;
      }
    },
  });
};
```

---

## 5. STREAMING DE RESPUESTAS

### Hook para Streaming
```typescript
// ✅ CORRECTO - hooks/useStreamingChat.ts
import { useCallback, useState } from 'react';
import { EventSource } from 'react-native-sse';

export const useStreamingChat = () => {
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  
  const sendStreamingMessage = useCallback(
    async (message: string, onChunk: (chunk: string) => void) => {
      setStreaming(true);
      setStreamedText('');
      
      const eventSource = new EventSource(
        `${BACKEND_URL}/api/chat/quick-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      );
      
      eventSource.addEventListener('message', (event) => {
        const chunk = event.data;
        setStreamedText(prev => prev + chunk);
        onChunk(chunk);
      });
      
      eventSource.addEventListener('error', (error) => {
        console.error('Streaming error:', error);
        setStreaming(false);
        eventSource.close();
      });
      
      eventSource.addEventListener('done', () => {
        setStreaming(false);
        eventSource.close();
      });
      
      return () => {
        eventSource.close();
      };
    },
    []
  );
  
  return { sendStreamingMessage, streaming, streamedText };
};
```

---

## 6. CALENDAR TOOL

### Tool para Agente OpenAI
```typescript
// ✅ CORRECTO - backend/app/api/chat/tools/calendarTool.ts
import { tool } from 'ai';
import { z } from 'zod';
import { getGoogleCalendarEvents } from '../../calendar/service';

export const calendarTool = tool({
  description: 'Obtiene eventos del calendario parroquial para fechas específicas',
  parameters: z.object({
    startDate: z.string().describe('Fecha de inicio en formato YYYY-MM-DD'),
    endDate: z.string().optional().describe('Fecha de fin (opcional)'),
  }),
  execute: async ({ startDate, endDate }) => {
    try {
      const events = await getGoogleCalendarEvents({
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: endDate ? `${endDate}T23:59:59Z` : undefined,
      });
      
      return {
        success: true,
        events: events.map(event => ({
          title: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          location: event.location,
          description: event.description,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: 'No se pudieron obtener los eventos',
      };
    }
  },
});
```

---

## 7. RATE LIMITER

### Limitación de Requests
```typescript
// ✅ CORRECTO - backend/app/api/chat/utils/rateLimiter.ts
import { LRUCache } from 'lru-cache';

interface RateLimiterOptions {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
}

class RateLimiter {
  private cache: LRUCache<string, number>;
  private interval: number;
  
  constructor(options: RateLimiterOptions) {
    this.interval = options.interval;
    this.cache = new LRUCache({
      max: options.uniqueTokenPerInterval,
      ttl: options.interval,
    });
  }
  
  async check(req: Request): Promise<boolean> {
    const identifier = this.getIdentifier(req);
    const count = this.cache.get(identifier) || 0;
    
    if (count >= 10) { // 10 requests por intervalo
      return false;
    }
    
    this.cache.set(identifier, count + 1);
    return true;
  }
  
  private getIdentifier(req: Request): string {
    // Usar IP o userId
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    return ip;
  }
}

export const rateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
});
```

---

## 8. STRUCTURED LOGGER

### Logging Centralizado
```typescript
// ✅ CORRECTO - backend/app/api/chat/utils/structuredLogger.ts
interface LogEntry {
  type: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

class StructuredLogger {
  log(entry: LogEntry) {
    console.log(JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      level: 'info',
    }));
  }
  
  error(entry: LogEntry) {
    console.error(JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      level: 'error',
    }));
  }
  
  debug(entry: LogEntry) {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString(),
        level: 'debug',
      }));
    }
  }
}

export const structuredLogger = new StructuredLogger();
```

---

## CHECKLIST

- [ ] ✅ Quick detector para routing inteligente
- [ ] ✅ Memory cache con 43 FAQs precargadas
- [ ] ✅ Redis cache para queries semánticas
- [ ] ✅ Exclusión de queries de calendario en caché
- [ ] ✅ Rate limiting en endpoints
- [ ] ✅ Structured logging en todas las operaciones
- [ ] ✅ Timeout apropiados (15s quick, 60s full)
- [ ] ✅ Manejo de errores con mensajes user-friendly
- [ ] ✅ Tools configurados en agente OpenAI
- [ ] ✅ Streaming implementado correctamente

---

## COMANDOS

```bash
# Poblar cache inicial
curl -X POST http://localhost:3000/api/admin/populate-cache

# Ver estadísticas de caché
curl http://localhost:3000/api/chat/cache-stats

# Ver logs estructurados
curl http://localhost:3000/api/debug/logger
```
