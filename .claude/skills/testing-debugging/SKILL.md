# Testing & Debugging Skill

## Testing Stack
- **Jest:** 29.7.0 con jest-expo 54.0.12
- **Testing Library:** @testing-library/react-native 13.3.3
- **Debug Tools:** React DevTools, Expo Dev Tools
- **Logging:** structuredLogger (backend)

## Cuándo Usar Este Skill
- ✅ Escribir tests para componentes
- ✅ Testear hooks personalizados
- ✅ Debuggear issues de producción
- ✅ Configurar CI/CD con tests
- ✅ Logging estructurado

---

## 1. CONFIGURACIÓN DE JEST

### jest.config.js
```javascript
// ✅ CORRECTO
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/.expo/**',
    '!**/babel.config.js',
    '!**/jest.config.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### jest.setup.js
```javascript
// ✅ CORRECTO
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Link: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));
```

---

## 2. TESTING DE COMPONENTES

### Test de Componente UI
```typescript
// ✅ CORRECTO - components/ui/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renderiza correctamente con children', () => {
    const { getByText } = render(
      <Button onPress={() => {}}>
        Click Me
      </Button>
    );
    
    expect(getByText('Click Me')).toBeTruthy();
  });
  
  it('llama onPress cuando se presiona', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button onPress={mockOnPress}>
        Click Me
      </Button>
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
  
  it('muestra loading spinner cuando loading=true', () => {
    const { getByTestId, queryByText } = render(
      <Button onPress={() => {}} loading={true}>
        Click Me
      </Button>
    );
    
    expect(queryByText('Click Me')).toBeNull();
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });
  
  it('está deshabilitado cuando disabled=true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button onPress={mockOnPress} disabled={true}>
        Click Me
      </Button>
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });
  
  it('aplica la variante correcta', () => {
    const { getByText } = render(
      <Button onPress={() => {}} variant="secondary">
        Secondary Button
      </Button>
    );
    
    const button = getByText('Secondary Button').parent;
    expect(button?.props.className).toContain('bg-gray-500');
  });
});
```

### Test de Componente con Datos
```typescript
// ✅ CORRECTO - components/__tests__/SantoCard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SantoCard } from '../SantoCard';

const mockSaint = {
  date: '2025-10-18',
  name: 'San Lucas',
  bio: 'Evangelista y médico',
};

describe('SantoCard', () => {
  it('renderiza información del santo', () => {
    const { getByText } = render(<SantoCard {...mockSaint} />);
    
    expect(getByText('San Lucas')).toBeTruthy();
    expect(getByText('Evangelista y médico')).toBeTruthy();
  });
  
  it('muestra loading state', () => {
    const { getByTestId } = render(
      <SantoCard {...mockSaint} loading={true} />
    );
    
    expect(getByTestId('santo-loading')).toBeTruthy();
  });
});
```

---

## 3. TESTING DE HOOKS

### Test de Hook con React Query
```typescript
// ✅ CORRECTO - hooks/__tests__/useDailyContent.test.tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDailyContent } from '../useDailyContent';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('useDailyContent', () => {
  beforeEach(() => {
    queryClient.clear();
  });
  
  it('fetches saint and gospel successfully', async () => {
    const mockSaint = {
      date: '2025-10-18',
      name: 'San Lucas',
      bio: 'Evangelista',
    };
    
    const mockGospel = {
      date: '2025-10-18',
      title: 'Evangelio del día',
      content: 'Lectura del santo evangelio...',
    };
    
    (supabase.from as jest.Mock).mockImplementation((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: table === 'saints' ? mockSaint : mockGospel,
        error: null,
      }),
    }));
    
    const { result } = renderHook(() => useDailyContent(), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.saint).toEqual(mockSaint);
    expect(result.current.gospel).toEqual(mockGospel);
    expect(result.current.error).toBeNull();
  });
  
  it('handles error correctly', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }));
    
    const { result } = renderHook(() => useDailyContent(), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.error).toBe('Database error');
  });
});
```

### Test de Hook con Zustand
```typescript
// ✅ CORRECTO - stores/__tests__/chatStore.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useChatStore } from '../chatStore';
import type { Message } from '@/types/chat';

describe('chatStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.clearMessages();
    });
  });
  
  it('añade mensaje correctamente', () => {
    const { result } = renderHook(() => useChatStore());
    
    const message: Message = {
      id: '1',
      text: 'Hola',
      isUser: true,
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addMessage(message);
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(message);
  });
  
  it('actualiza mensaje existente', () => {
    const { result } = renderHook(() => useChatStore());
    
    const message: Message = {
      id: '1',
      text: 'Hola',
      isUser: true,
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addMessage(message);
      result.current.updateMessage('1', { text: 'Hola actualizado' });
    });
    
    expect(result.current.messages[0].text).toBe('Hola actualizado');
  });
  
  it('limpia todos los mensajes', () => {
    const { result } = renderHook(() => useChatStore());
    
    act(() => {
      result.current.addMessage({
        id: '1',
        text: 'Mensaje 1',
        isUser: true,
        timestamp: new Date(),
      });
      result.current.addMessage({
        id: '2',
        text: 'Mensaje 2',
        isUser: false,
        timestamp: new Date(),
      });
      result.current.clearMessages();
    });
    
    expect(result.current.messages).toHaveLength(0);
  });
});
```

---

## 4. TESTING DE SCREENS

### Test de Pantalla
```typescript
// ✅ CORRECTO - app/(tabs)/__tests__/home.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '../home';
import { useDailyContent } from '@/hooks/useDailyContent';

jest.mock('@/hooks/useDailyContent');

const queryClient = new QueryClient();

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('HomeScreen', () => {
  it('muestra loading state', () => {
    (useDailyContent as jest.Mock).mockReturnValue({
      saint: null,
      gospel: null,
      loading: true,
      error: null,
    });
    
    const { getByTestId } = render(<HomeScreen />, { wrapper });
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });
  
  it('muestra santo y evangelio cuando cargan', async () => {
    (useDailyContent as jest.Mock).mockReturnValue({
      saint: {
        date: '2025-10-18',
        name: 'San Lucas',
        bio: 'Evangelista',
      },
      gospel: {
        date: '2025-10-18',
        title: 'Evangelio del día',
        content: 'Lectura...',
      },
      loading: false,
      error: null,
    });
    
    const { getByText } = render(<HomeScreen />, { wrapper });
    
    expect(getByText('San Lucas')).toBeTruthy();
    expect(getByText('Evangelio del día')).toBeTruthy();
  });
  
  it('muestra mensaje de error', () => {
    (useDailyContent as jest.Mock).mockReturnValue({
      saint: null,
      gospel: null,
      loading: false,
      error: 'Error al cargar contenido',
    });
    
    const { getByText } = render(<HomeScreen />, { wrapper });
    expect(getByText('Error al cargar contenido')).toBeTruthy();
  });
});
```

---

## 5. INTEGRATION TESTS

### Test de Flujo Completo
```typescript
// ✅ CORRECTO - __tests__/integration/auth-flow.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginScreen from '@/app/(auth)/login';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

const queryClient = new QueryClient();

describe('Auth Flow Integration', () => {
  it('permite login exitoso', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    });
    
    (supabase.auth.signInWithPassword as jest.Mock) = mockSignIn;
    
    const { getByPlaceholderText, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <LoginScreen />
      </QueryClientProvider>
    );
    
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Contraseña');
    const loginButton = getByText('Iniciar Sesión');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

---

## 6. DEBUGGING

### React DevTools
```bash
# Instalar React DevTools
npm install -g react-devtools

# Ejecutar
react-devtools

# En tu app, asegúrate de tener:
# import 'react-devtools';
```

### Expo Dev Tools
```typescript
// ✅ CORRECTO - Debugging con Expo
import { Platform } from 'react-native';

// Remote debugging
if (__DEV__) {
  console.log('🐛 Modo desarrollo activado');
}

// Log condicional
const DEBUG = __DEV__ && Platform.OS === 'ios';

if (DEBUG) {
  console.log('Estado actual:', state);
}
```

### Structured Logger (Backend)
```typescript
// ✅ CORRECTO - backend/app/api/chat/utils/structuredLogger.ts
class StructuredLogger {
  log(entry: {
    type: string;
    requestId?: string;
    userId?: string;
    [key: string]: any;
  }) {
    console.log(JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      level: 'info',
      environment: process.env.NODE_ENV,
    }));
  }
  
  error(entry: {
    type: string;
    error: string;
    [key: string]: any;
  }) {
    console.error(JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      level: 'error',
    }));
  }
}

export const logger = new StructuredLogger();

// Uso
logger.log({
  type: 'chat_request',
  requestId: '123',
  userId: 'abc',
  messageLength: 50,
});
```

### Debug Dashboard
```typescript
// ✅ CORRECTO - hooks/useDebugLogger.ts
import { useEffect } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export const useDebugLogger = (componentName: string) => {
  useEffect(() => {
    if (__DEV__) {
      console.log(`[${componentName}] Mounted`);
      
      return () => {
        console.log(`[${componentName}] Unmounted`);
      };
    }
  }, [componentName]);
  
  const logEvent = async (event: string, data?: any) => {
    if (!__DEV__) return;
    
    console.log(`[${componentName}] ${event}`, data);
    
    // Opcional: enviar a backend dashboard
    try {
      await fetch(`${BACKEND_URL}/api/debug/logger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component: componentName,
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Fail silently
    }
  };
  
  return { logEvent };
};
```

---

## 7. COMMON DEBUGGING SCENARIOS

### Network Issues
```typescript
// ✅ CORRECTO - Debug network requests
import { useEffect } from 'react';

if (__DEV__) {
  const originalFetch = global.fetch;
  global.fetch = async (...args) => {
    console.log('📡 Fetch:', args[0]);
    const response = await originalFetch(...args);
    console.log('✅ Response:', response.status);
    return response;
  };
}
```

### State Issues
```typescript
// ✅ CORRECTO - Debug Zustand state
import { devtools } from 'zustand/middleware';

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        // ...store implementation
      }),
      { name: 'chat-storage' }
    ),
    { name: 'ChatStore' } // Nombre en DevTools
  )
);
```

### React Query Issues
```typescript
// ✅ CORRECTO - React Query DevTools (web only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
      {Platform.OS === 'web' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

---

## 8. ERROR BOUNDARIES

### Error Boundary Component
```typescript
// ✅ CORRECTO - components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Opcional: enviar a servicio de logging
    if (!__DEV__) {
      // logErrorToService(error, errorInfo);
    }
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-bold text-red-600 mb-2">
            Algo salió mal
          </Text>
          <Text className="text-gray-600 text-center mb-4">
            {this.state.error?.message}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

---

## CHECKLIST

- [ ] ✅ Tests para componentes críticos
- [ ] ✅ Tests para hooks personalizados
- [ ] ✅ Tests de integración para flujos principales
- [ ] ✅ Error boundaries implementados
- [ ] ✅ Structured logging en backend
- [ ] ✅ Debug dashboard configurado (dev)
- [ ] ✅ Coverage >70% en código crítico
- [ ] ✅ CI/CD ejecuta tests automáticamente

---

## COMANDOS

```bash
# Ejecutar tests
npm test

# Tests en watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Tests específicos
npm test -- SantoCard

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```
