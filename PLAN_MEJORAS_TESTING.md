# Plan de Mejoras para Testing

**Fecha de creación**: 8 de noviembre de 2025
**Estado actual**: 2/5 ⭐ - Testing básico implementado
**Meta**: 4/5 ⭐ - Cobertura del 60% con tests críticos

---

## 📊 Estado Actual del Testing

### ✅ Tests Implementados

**Frontend:**
- `hooks/__tests__/useQuickDetector.test.ts` - 50+ casos de test
- `__tests__/chatStore.test.ts` - Store de Zustand
- `__tests__/useDebugLogger.test.ts` - Sistema de logging

**Backend:**
- `backend/app/api/chat/utils/__tests__/memoryCache.test.ts` - Cache en memoria

**Estado**: 4 suites de tests pasando ✅

### ❌ Gaps Críticos

**Sin tests:**
- Componentes de chat (MessageBubble, ChatInput, MessageList)
- Hook crítico `useChat.ts` (gestión completa del chat)
- Hook `useStreamingChat.ts` (SSE streaming)
- API routes principales (`/api/chat/*`)
- Tools de backend (pineconeTool, calendarTool)
- Flujos de autenticación

---

## 🎯 Objetivos del Plan

### Fase 1 (Semana 1-2): Tests Críticos
**Meta**: 30% cobertura - Tests para funcionalidad core

1. **Hook useChat** (Prioridad: CRÍTICA)
   - Envío de mensajes
   - Gestión de historial
   - Manejo de errores
   - Estado de carga

2. **API /api/chat/message-stream** (Prioridad: CRÍTICA)
   - Respuesta streaming correcta
   - Manejo de errores
   - Timeout behavior
   - Content moderation

3. **Componente MessageBubble** (Prioridad: ALTA)
   - Renderizado de mensajes user/assistant
   - Markdown rendering
   - Manejo de attachments
   - Estados de carga

### Fase 2 (Semana 3-4): Tests de Integración
**Meta**: 50% cobertura - Flujos completos

4. **Flujo completo de chat** (Prioridad: ALTA)
   - Usuario envía mensaje → Backend procesa → Respuesta mostrada
   - Streaming SSE funciona correctamente
   - Cache hits funcionan
   - Memory cache para FAQs

5. **Tests de Tools** (Prioridad: MEDIA)
   - pineconeTool con mocks de Pinecone
   - calendarTool con mocks de Google Calendar
   - Query Expansion con mocks de Claude
   - RRF (Reciprocal Rank Fusion)

6. **Autenticación** (Prioridad: MEDIA)
   - Login/Logout
   - Token refresh
   - Manejo de sesiones expiradas

### Fase 3 (Mes 2): Tests Exhaustivos
**Meta**: 60% cobertura - Casos edge y optimizaciones

7. **Componentes UI** (Prioridad: BAJA)
   - Button, Card, Input
   - Loading states
   - Empty states
   - Error boundaries

8. **Edge Cases** (Prioridad: BAJA)
   - Mensajes muy largos
   - Historial extenso
   - Network failures
   - Concurrent requests

9. **Performance Tests** (Prioridad: BAJA)
   - Tiempo de respuesta de APIs
   - Benchmarking de cache
   - Memory leaks

---

## 📝 Estrategia de Testing

### Frontend Testing (React Native + Expo)

**Herramientas:**
- Jest (ya configurado)
- @testing-library/react-native (instalado)
- @testing-library/react-hooks
- MSW (Mock Service Worker) para API mocking

**Patrón recomendado:**
```typescript
// hooks/__tests__/useChat.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useChat } from '../useChat';

describe('useChat', () => {
  it('debe enviar mensaje y actualizar historial', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hola');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hola');
  });

  it('debe manejar errores de red', async () => {
    // Mock fetch to fail
    global.fetch = jest.fn(() => Promise.reject('Network error'));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    expect(result.current.error).toBeTruthy();
  });
});
```

### Backend Testing (Next.js API Routes)

**Herramientas:**
- Jest (configurado en backend/jest.config.js)
- Supertest para API testing
- Mocks para Pinecone, OpenAI, Anthropic

**Patrón recomendado:**
```typescript
// backend/app/api/chat/__tests__/message-stream.test.ts
import { POST } from '../message-stream/route';
import { NextRequest } from 'next/server';

describe('POST /api/chat/message-stream', () => {
  it('debe retornar streaming response', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/message-stream', {
      method: 'POST',
      body: JSON.stringify({
        message: '¿Qué es un bautismo?',
        conversationHistory: []
      })
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });

  it('debe rechazar mensajes inapropiados', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/message-stream', {
      method: 'POST',
      body: JSON.stringify({
        message: 'contenido ofensivo',
        conversationHistory: []
      })
    });

    const response = await POST(request);

    // Verificar que content moderation bloquea
    expect(response.status).toBe(400);
  });
});
```

### Integration Testing

**Herramientas:**
- Playwright o Detox (E2E)
- React Native Testing Library

**Casos clave:**
1. Usuario abre app → Ve chat → Envía mensaje → Recibe respuesta
2. Usuario sin conexión → Ve mensaje de error → Se reconecta → Funciona
3. Usuario instala PWA → Recibe notificación → Abre app instalada

---

## 🔧 Setup Necesario

### Instalar dependencias faltantes:

```bash
# Frontend
npm install --save-dev @testing-library/react-hooks msw

# Backend (si no están instaladas)
cd backend
npm install --save-dev supertest @types/supertest
```

### Configurar MSW (Mock Service Worker):

```typescript
// __mocks__/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/chat/message-stream', () => {
    return HttpResponse.json({
      role: 'assistant',
      content: 'Respuesta de prueba'
    });
  }),
];

export const server = setupServer(...handlers);
```

```typescript
// jest.setup.js (agregar)
import { server } from './__mocks__/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 📈 Métricas de Éxito

### KPIs

1. **Cobertura de código**: 60% (target Fase 3)
2. **Tests pasando**: 100% (siempre)
3. **Tiempo de ejecución**: < 30 segundos (suite completa)
4. **Flaky tests**: 0 (estabilidad)

### Tracking

```bash
# Correr tests con coverage
npm test -- --coverage

# Ver reporte HTML
open coverage/lcov-report/index.html
```

### CI/CD Integration

Configurar GitHub Actions para correr tests automáticamente:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## 🚦 Checklist de Implementación

### Fase 1: Tests Críticos (Semana 1-2)

- [ ] Instalar dependencias de testing faltantes
- [ ] Configurar MSW para mocking de APIs
- [ ] **Test: useChat hook**
  - [ ] Envío de mensajes
  - [ ] Gestión de historial
  - [ ] Manejo de errores
  - [ ] Loading states
- [ ] **Test: /api/chat/message-stream**
  - [ ] Streaming response
  - [ ] Content moderation
  - [ ] Timeout handling
  - [ ] Error responses
- [ ] **Test: MessageBubble component**
  - [ ] Renderizado user/assistant
  - [ ] Markdown rendering
  - [ ] Attachments
  - [ ] Loading indicator

### Fase 2: Tests de Integración (Semana 3-4)

- [ ] **Test: Flujo completo de chat**
  - [ ] User → Backend → Response
  - [ ] SSE streaming funcional
  - [ ] Cache hits
  - [ ] Memory cache FAQs
- [ ] **Test: pineconeTool**
  - [ ] Búsqueda básica
  - [ ] Query Expansion
  - [ ] RRF fusion
  - [ ] Error handling
- [ ] **Test: Autenticación**
  - [ ] Login/Logout
  - [ ] Token refresh
  - [ ] Session expiry

### Fase 3: Tests Exhaustivos (Mes 2)

- [ ] Tests para componentes UI
- [ ] Edge cases y error handling
- [ ] Performance tests
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Integrar Codecov para tracking de cobertura

---

## 💡 Mejores Prácticas

### DO:
- ✅ Usar mocks para servicios externos (Pinecone, OpenAI, Supabase)
- ✅ Tests aislados (no dependen unos de otros)
- ✅ Nombres descriptivos: `debe enviar mensaje cuando el usuario presiona Enter`
- ✅ Arrange-Act-Assert pattern
- ✅ Testing de casos edge (network errors, empty responses)

### DON'T:
- ❌ Tests que hacen llamadas reales a APIs (costoso y lento)
- ❌ Tests con sleeps/timeouts arbitrarios (flaky)
- ❌ Tests que dependen de orden de ejecución
- ❌ Tests con hardcoded valores sensibles a cambios
- ❌ Testear implementación interna (test behavior, not implementation)

---

## 📚 Recursos

### Documentación:
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Testing Next.js API Routes](https://nextjs.org/docs/app/building-your-application/testing)

### Ejemplos de proyectos:
- [Real World React Native](https://github.com/react-native-community/RNTester)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

---

## 🎯 Próximos Pasos Inmediatos

**Esta semana:**

1. Instalar dependencias faltantes (30 min)
2. Configurar MSW para API mocking (1 hora)
3. Escribir tests para `useChat` hook (3 horas)
4. Escribir tests para `/api/chat/message-stream` (4 horas)
5. Escribir tests para `MessageBubble` (2 horas)

**Total estimado Fase 1**: ~10-12 horas de desarrollo

---

**Última actualización**: 8 de noviembre de 2025
**Responsable**: Equipo de desarrollo
**Próxima revisión**: 22 de noviembre de 2025
