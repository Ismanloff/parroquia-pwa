# Testing en Parroquias App

Este proyecto usa **Jest** y **React Native Testing Library** para pruebas unitarias y de integración.

## 🚀 Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (se re-ejecutan al cambiar código)
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests específicos
npm test -- --testPathPattern=MessageBubble
```

## 📁 Estructura

```
__tests__/
├── MessageBubble.test.tsx      # Tests del componente de burbujas de mensaje
├── chatStore.test.ts           # Tests del store de Zustand
└── useDebugLogger.test.ts      # Tests del sistema de logging
```

## 📝 Ejemplos de Tests

### Test de Componente

```typescript
import { render, screen } from '@testing-library/react-native';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  it('debe renderizar correctamente', () => {
    render(<MyComponent text="Hola" />);
    expect(screen.getByText('Hola')).toBeTruthy();
  });
});
```

### Test de Hook/Store

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useChatStore } from '../stores/chatStore';

describe('chatStore', () => {
  it('debe agregar un mensaje', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.addMessage({
        id: '1',
        role: 'user',
        content: 'Hola',
        timestamp: Date.now(),
      });
    });

    expect(result.current.messages).toHaveLength(1);
  });
});
```

## 🔧 Configuración

### jest.config.js
Configuración principal de Jest con:
- Preset de `jest-expo`
- Mapeo de rutas (`@/` → raíz)
- Patrones de exclusión para node_modules
- Cobertura de código

### jest.setup.js
Configuración de mocks globales:
- AsyncStorage mock
- Expo Haptics mock
- React Native Reanimated mock
- Expo Router mock
- fetch global mock

## ✅ Cobertura Actual

Los tests cubren:
- ✅ **MessageBubble**: Renderizado, attachments, markdown, edge cases
- ✅ **chatStore**: Estado, acciones (add/update/clear), integración
- ✅ **useDebugLogger**: Sanitización, niveles de log, manejo de errores

## 📊 Resultados Recientes

```
Test Suites: 3 passed, 3 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        1.906 s
```

## 🎯 Mejores Prácticas

1. **Describe bloques claros**: Agrupa tests relacionados
2. **Nombres descriptivos**: Los tests deben explicar qué prueban
3. **Arrange-Act-Assert**: Estructura clara de tests
4. **Mock lo necesario**: No sobremockees, pero aísla dependencias externas
5. **Tests independientes**: Cada test debe poder correr solo

## 🔍 Debugging Tests

```bash
# Ver logs detallados
npm test -- --verbose

# Ejecutar un solo test
npm test -- --testNamePattern="debe truncar mensajes"

# Ver cobertura de archivos específicos
npm test -- --collectCoverageFrom="hooks/**/*.ts"
```

## 🚧 Próximos Tests a Agregar

- [ ] `AttachmentCard.test.tsx` - Tests para cards de attachments
- [ ] `MessageList.test.tsx` - Tests para lista de mensajes y scroll
- [ ] `useSendMessage.test.ts` - Tests para hook de envío de mensajes
- [ ] `AuthContext.test.tsx` - Tests para contexto de autenticación
- [ ] `ThemeContext.test.tsx` - Tests para contexto de tema

## 🐛 Troubleshooting

### Error: Cannot find module
```bash
# Limpiar cache de Jest
npm test -- --clearCache
```

### Tests pasan localmente pero fallan en CI
- Verifica que las dependencias estén instaladas
- Revisa las variables de entorno
- Asegúrate de que los mocks estén configurados

### Tests lentos
- Usa `--maxWorkers=2` para limitar workers
- Mockea llamadas a red/filesystem
- Evita timeouts innecesarios en tests
