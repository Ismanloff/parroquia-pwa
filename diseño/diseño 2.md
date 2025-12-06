<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Guía Completa: React Native Profesional 2025

**Construye aplicaciones modernas multiplataforma con TypeScript, Nueva Arquitectura y las mejores prácticas actualizadas a Octubre 2025**

*⏱️ Tiempo estimado de lectura: 45 minutos*

***

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Versiones Actuales y Breaking Changes](#versiones-actuales-y-breaking-changes)
3. [Stack Tecnológico Comparado](#stack-tecnol%C3%B3gico-comparado)
4. [Creación del Proyecto](#creaci%C3%B3n-del-proyecto)
5. [Arquitectura Escalable](#arquitectura-escalable)
6. [Navegación](#navegaci%C3%B3n)
7. [Estado Global y Datos](#estado-global-y-datos)
8. [Sistema de Diseño Moderno](#sistema-de-dise%C3%B1o-moderno)
9. [Formularios](#formularios)
10. [Internacionalización](#internacionalizaci%C3%B3n)
11. [Rendimiento y Nueva Arquitectura](#rendimiento-y-nueva-arquitectura)
12. [Seguridad y Privacidad](#seguridad-y-privacidad)
13. [Notificaciones y Enlaces](#notificaciones-y-enlaces)
14. [Medios y Archivos](#medios-y-archivos)
15. [Analítica y Experimentación](#anal%C3%ADtica-y-experimentaci%C3%B3n)
16. [Testing](#testing)
17. [CI/CD con EAS y Fastlane](#cicd-con-eas-y-fastlane)
18. [Publicación](#publicaci%C3%B3n)
19. [Recetario de Pantallas](#recetario-de-pantallas)
20. [Plantillas Completas](#plantillas-completas)
21. [Primeros 60 Minutos](#primeros-60-minutos)
22. [Apéndice de Referencias](#ap%C3%A9ndice-de-referencias)

***

## Resumen Ejecutivo

### Decisiones Clave para 2025

**React Native ha alcanzado un punto de inflexión en octubre de 2025.** La Nueva Arquitectura ya no es experimental - es la realidad de producción. Los cambios fundamentales de los últimos 18 meses han consolidado un ecosistema más robusto, rápido y confiable.

![Stack Tecnológico Recomendado para React Native 2025](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b4381e1ba9bebc825a102766ed4bd167/0d392485-5992-4c2b-b4a4-9b754bfb3f86/affe4964.png)

Stack Tecnológico Recomendado para React Native 2025

### Stack Recomendado (Octubre 2025):

| Categoría | Tecnología | Versión | Justificación |
| :-- | :-- | :-- | :-- |
| **Core** | React Native | 0.82.0 | Primera versión 100% Nueva Arquitectura[^1] |
| **SDK** | Expo SDK | 54.0 | Última estable, React Native 0.81[^2] |
| **TypeScript** | TypeScript | 5.6+ | Soporte nativo mejorado[^2] |
| **Navegación** | Expo Router | v6.0 | File-based routing, web-first[^3] |
| **Estado** | Zustand | 5.0.8 | Más simple que Redux, menos boilerplate[^4] |
| **Datos** | TanStack Query | v5.x | API rediseñada, mejor rendimiento[^5] |
| **UI** | NativeWind | v4.0 | Tailwind CSS nativo, mejor DX[^6] |
| **Formularios** | React Hook Form | 7.65.0 | Compatible con React 19[^7] |
| **Animaciones** | Reanimated | 4.x / 3.19.x | v4 solo Nueva Arquitectura[^8] |
| **Testing** | Detox | Latest | E2E testing especializado[^9] |

### Cambios Críticos 2024-2025:

- **Nueva Arquitectura obligatoria** desde RN 0.82[^1]
- **Flipper oficialmente descontinuado** - usar React DevTools[^10]
- **iOS SDK 18 requerido** desde abril 2025[^11]
- **SDK 54 es el último** con soporte Legacy Architecture[^12]
- **TanStack Query v5** rompe compatibilidad con v4[^5]

![React Native Version Roadmap 2024-2025 - Evolución hacia la Nueva Arquitectura](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b4381e1ba9bebc825a102766ed4bd167/2c0a83d9-c358-4814-8ead-4914f2311468/8cc9e779.png)

React Native Version Roadmap 2024-2025 - Evolución hacia la Nueva Arquitectura

***

## Versiones Actuales y Breaking Changes

### Stack Base - Octubre 2025

| Tecnología | Versión Estable | Breaking Changes | Nueva Arquitectura |
| :-- | :-- | :-- | :-- |
| **React Native** | 0.82.0 | Removed Legacy Architecture[^1] | ✅ Requerida |
| **Expo SDK** | 54.0.0 | Last Legacy support[^12] | ✅ Por defecto |
| **React** | 19.1.1 | New compiler features | ✅ Completo |
| **Node.js** | 20.19.4+ | Required for Expo SDK 54 | - |

### Requisitos Mínimos por Plataforma

**iOS (Octubre 2025):**

- iOS 15.1+ (cambio desde iOS 13.4 en RN 0.76)[^13]
- Xcode 16.1+ **OBLIGATORIO** desde abril 2025[^11]
- iOS 18 SDK requerido para App Store[^11]

**Android:**

- SDK 24+ (Android 7.0)
- compileSdkVersion 35
- Gradle 8.x
- Android 16KB page support (RN 0.77+)[^14]


### Breaking Changes Importantes

**Expo SDK 54 → SDK 55 (Future):**

- **No soporte Legacy Architecture** - solo Nueva Arquitectura[^12]
- Reanimated v4 obligatorio[^12]
- Flash List v2 requiere Nueva Arquitectura[^12]

**TanStack Query v5:**

```typescript
// ❌ v4 (obsoleto)
const { data, isLoading, error } = useQuery('users', fetchUsers);

// ✅ v5 (actual)
const { data, isPending, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

**React Navigation 7.0:**

- Nueva Static API para mejor TypeScript[^15]
- Linking API rediseñada
- Mejor soporte para deep linking universal

***

## Stack Tecnológico Comparado

![React Navigation 7.0 vs Expo Router v6 - Comparación detallada para proyectos React Native en 2025](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b4381e1ba9bebc825a102766ed4bd167/6dd9c0e5-661d-445b-8e78-10639c329cdf/e57db8ce.png)

React Navigation 7.0 vs Expo Router v6 - Comparación detallada para proyectos React Native en 2025

### Navegación: Expo Router vs React Navigation

**Recomendación: Expo Router v6 para proyectos nuevos**


| Criterio | Expo Router v6 | React Navigation 7.0 |
| :-- | :-- | :-- |
| **Routing** | File-based (como Next.js) | Configuración manual |
| **TypeScript** | Bueno | Excelente (Static API) |
| **Web Support** | Nativo | Limitado |
| **Learning Curve** | Familiar para web devs | React Native específico |
| **Bundle Size** | Más pequeño | Más grande |
| **Deep Linking** | Automático | Manual |

**Cuándo usar React Navigation:**

- Proyectos existentes grandes
- Navegación muy compleja
- Necesitas control total sobre la configuración

**Cuándo usar Expo Router:**

- Proyectos nuevos
- Soporte web importante
- Equipos familiarizados con Next.js
- Prototipado rápido


### Estado: Zustand vs Redux Toolkit

**Recomendación: Zustand v5 para la mayoría de casos**

```typescript
// Zustand - Simple y directo
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Redux Toolkit - Más verboso pero más estructurado
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: false },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    }
  }
});
```

**Usar Redux Toolkit cuando:**

- Aplicación muy grande (50+ pantallas)
- Múltiples desarrolladores
- Estado muy complejo con relaciones
- Time travel debugging necesario


### UI: NativeWind vs Tamagui vs StyleSheet

**Recomendación: NativeWind v4**

**NativeWind v4 - Ventajas:**

- Tailwind CSS familiar[^6]
- Compilación en build time
- Mejor tree shaking
- Soporte universal (web + mobile)
- Pequeño runtime

**Tamagui - Ventajas:**

- Performance extrema
- Animaciones nativas
- Sistema de temas avanzado
- Bundle size muy optimizado

**Cuándo usar cada uno:**

- **NativeWind**: Equipos familiarizados con Tailwind, desarrollo rápido
- **Tamagui**: Performance crítica, animaciones complejas
- **StyleSheet**: Proyectos simples, control total

***

## Creación del Proyecto

### Proyecto Expo con TypeScript (Recomendado)

```bash
# 1. Crear proyecto con TypeScript y navegación
npx create-expo-app@latest MiApp --template tabs

cd MiApp

# 2. Actualizar a SDK 54 si es necesario
npx expo install expo@^54.0.0 --fix

# 3. Verificar configuración
npx expo-doctor
```


### Estructura de Carpetas Escalable

```
MiApp/
├── app/                      # Expo Router páginas
│   ├── (tabs)/              # Tabs layout
│   │   ├── index.tsx        # Home
│   │   ├── search.tsx       # Búsqueda
│   │   └── profile.tsx      # Perfil
│   ├── auth/                # Autenticación
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── product/             # Producto
│   │   └── [id].tsx         # Detalle dinámico
│   ├── _layout.tsx          # Layout raíz
│   └── +not-found.tsx       # 404
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Sistema de diseño
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── forms/          # Componentes de formularios
│   │   ├── layout/         # Layouts y navegación
│   │   └── feedback/       # Loading, Error, Empty states
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   └── api/           # Hooks de API
│   ├── services/           # APIs y servicios externos
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── storage.ts
│   ├── stores/             # Estado global (Zustand)
│   │   ├── auth.ts
│   │   ├── cart.ts
│   │   └── settings.ts
│   ├── types/              # Tipos TypeScript
│   │   ├── api.ts
│   │   ├── navigation.ts
│   │   └── global.ts
│   ├── utils/              # Utilidades
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   └── constants/          # Constantes y tokens
│       ├── design-tokens.ts
│       ├── api-endpoints.ts
│       └── storage-keys.ts
├── assets/                 # Recursos estáticos
│   ├── images/
│   ├── icons/
│   └── fonts/
├── locales/               # Traducciones
│   ├── en/
│   ├── es/
│   └── index.ts
├── docs/                  # Documentación
│   ├── CONTRIBUTING.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
├── global.css            # NativeWind styles
├── tailwind.config.js    # Tailwind configuration
├── metro.config.js       # Metro bundler
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
└── package.json
```


### Configuración TypeScript Estricta

**tsconfig.json:**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "global.css"],
  "exclude": ["node_modules"]
}
```


### Configuración de Herramientas

**ESLint + Prettier + Husky:**

```bash
# Instalar herramientas de desarrollo
npm install -D eslint prettier husky lint-staged

# Configurar hooks pre-commit
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**package.json scripts:**

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "test": "jest",
    "test:e2e": "detox test",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "submit": "eas submit"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```


***

## Arquitectura Escalable

### Clean Architecture Adaptada

```
📁 src/
├── 📁 app/                    # Capa de aplicación
│   ├── navigation/           # Configuración de navegación
│   ├── providers/           # Context providers
│   └── store/              # Configuración de store global
├── 📁 features/              # Características de negocio
│   ├── auth/               # Feature: Autenticación
│   │   ├── components/     # Componentes específicos
│   │   ├── hooks/         # Hooks del feature
│   │   ├── services/      # Lógica de negocio
│   │   ├── store/         # Estado local del feature
│   │   └── types/         # Tipos del feature
│   ├── products/          # Feature: Productos
│   └── profile/           # Feature: Perfil
├── 📁 shared/               # Componentes y lógica compartida
│   ├── ui/                # Sistema de diseño
│   ├── hooks/             # Hooks reutilizables
│   ├── services/          # Servicios compartidos
│   ├── utils/             # Utilidades
│   └── types/             # Tipos compartidos
└── 📁 infrastructure/       # Capa de infraestructura
    ├── api/               # Cliente HTTP
    ├── storage/           # Persistencia local
    ├── notifications/     # Push notifications
    └── analytics/         # Analytics y tracking
```


### Ejemplo de Feature: Auth

**src/features/auth/types/index.ts:**

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
  verified: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword: string;
}
```

**src/features/auth/services/authService.ts:**

```typescript
import { apiClient } from '@/infrastructure/api';
import { storage } from '@/infrastructure/storage';
import { User, LoginCredentials, RegisterData } from '../types';

export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', credentials);

    // Guardar tokens de forma segura
    await storage.setSecure(this.TOKEN_KEY, response.accessToken);
    await storage.setSecure(this.REFRESH_TOKEN_KEY, response.refreshToken);

    return {
      user: response.user,
      token: response.accessToken,
    };
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', data);

    await storage.setSecure(this.TOKEN_KEY, response.accessToken);
    await storage.setSecure(this.REFRESH_TOKEN_KEY, response.refreshToken);

    return {
      user: response.user,
      token: response.accessToken,
    };
  }

  async logout(): Promise<void> {
    try {
      const token = await storage.getSecure(this.TOKEN_KEY);
      if (token) {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      await storage.deleteSecure(this.TOKEN_KEY);
      await storage.deleteSecure(this.REFRESH_TOKEN_KEY);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await storage.getSecure(this.TOKEN_KEY);
      if (!token) return null;

      const response = await apiClient.get<User>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response;
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await storage.getSecure(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken
      });

      await storage.setSecure(this.TOKEN_KEY, response.accessToken);
      return response.accessToken;
    } catch {
      await this.logout();
      return null;
    }
  }
}

export const authService = new AuthService();
```

**src/features/auth/store/authStore.ts:**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acciones
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authService.login(credentials);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authService.register(data);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            set({ user, isAuthenticated: true });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
```


***

## Navegación

### Expo Router v6 - Configuración Completa

**app/_layout.tsx (Layout Raíz):**

```typescript
import React from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/src/providers/ThemeProvider';
import { AuthGuard } from '@/src/components/AuthGuard';
import '../global.css'; // NativeWind styles

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos (era cacheTime en v4)
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthGuard>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen 
                  name="product" 
                  options={{ 
                    headerShown: true,
                    title: 'Producto',
                    presentation: 'modal'
                  }} 
                />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AuthGuard>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

**app/(tabs)/_layout.tsx (Tabs Layout):**

```typescript
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#007AFF',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          borderTopColor: colorScheme === 'dark' ? '#38383A' : '#E5E5E7',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```


### Navegación Tipada

**src/types/navigation.ts:**

```typescript
export type RootStackParamList = {
  '(tabs)': undefined;
  'auth': undefined;
  'auth/login': undefined;
  'auth/register': undefined;
  'product/[id]': { id: string; variant?: string };
  'settings': undefined;
  '+not-found': undefined;
};

export type TabParamList = {
  'index': undefined;
  'search': { query?: string; category?: string };
  'profile': undefined;
};

// Helpers para navegación tipada
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```


### Deep Linking y Universal Links

**app.json configuración:**

```json
{
  "expo": {
    "scheme": "miapp",
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-router",
        {
          "headOrigin": "https://miapp.com",
          "asyncRoutes": "development"
        }
      ]
    ]
  }
}
```

**Routing automático:**

- `app/product/[id].tsx` → `/product/123` y `miapp://product/123`
- `app/auth/login.tsx` → `/auth/login` y `miapp://auth/login`

**app/product/[id].tsx:**

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProduct } from '@/src/hooks/api/useProducts';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';

export default function ProductScreen() {
  const { id, variant } = useLocalSearchParams<{ id: string; variant?: string }>();
  const router = useRouter();
  
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Text>Error loading product</Text>;

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold">{product?.name}</Text>
      {variant && (
        <Text className="text-gray-600">Variant: {variant}</Text>
      )}
      {/* Resto del contenido */}
    </View>
  );
}
```


***

## Estado Global y Datos

### TanStack Query v5 - API Completa

**src/services/api.ts:**

```typescript
import { QueryClient } from '@tanstack/react-query';
import { storage } from '@/infrastructure/storage';

const BASE_URL = 'https://api.miapp.com/v1';

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    return await storage.getSecure('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado, intentar refresh
        await this.handleTokenRefresh();
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async handleTokenRefresh() {
    // Implementar refresh token logic
    // Por ahora, redirigir a login
    // router.push('/auth/login');
  }

  // Métodos GET
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Métodos POST
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Métodos PUT
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Métodos DELETE
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(BASE_URL);

// Query client configuración
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos (cambió de cacheTime en v5)
      retry: (failureCount, error: any) => {
        if (error.status === 404 || error.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
```


### Hooks de API Tipados

**src/hooks/api/useProducts.ts:**

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData, // Función importada en v5
} from '@tanstack/react-query';
import { apiClient, ApiResponse, PaginatedResponse } from '@/src/services/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Query Keys Factory
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Hook para obtener lista de productos
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async (): Promise<Product[]> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get<ApiResponse<Product[]>>(
        `/products?${params.toString()}`
      );
      return response.data;
    },
    placeholderData: keepPreviousData, // Cambió de keepPreviousData: true en v5
  });
}

// Hook para obtener productos con paginación infinita
export function useInfiniteProducts(filters: ProductFilters = {}) {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Product>> => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: '20',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await apiClient.get<PaginatedResponse<Product>>(
        `/products?${params.toString()}`
      );
      return response;
    },
    initialPageParam: 1, // Requerido en v5
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    maxPages: 10, // Limitar páginas en memoria
  });
}

// Hook para obtener un producto específico
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async (): Promise<Product> => {
      const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
      return response.data;
    },
    enabled: !!id, // Solo ejecutar si hay ID
  });
}

// Hook para crear producto
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
      const response = await apiClient.post<ApiResponse<Product>>('/products', productData);
      return response.data;
    },
    onSuccess: (newProduct) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      
      // Actualización optimista - añadir a caché
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);
    },
    onError: (error) => {
      console.error('Error creating product:', error);
    },
  });
}

// Hook para actualizar producto
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }): Promise<Product> => {
      const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, updates);
      return response.data;
    },
    onMutate: async ({ id, ...updates }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });

      // Snapshot del estado anterior
      const previousProduct = queryClient.getQueryData(productKeys.detail(id));

      // Actualización optimista
      queryClient.setQueryData(productKeys.detail(id), (old: Product | undefined) => 
        old ? { ...old, ...updates } : undefined
      );

      return { previousProduct };
    },
    onError: (error, { id }, context) => {
      // Rollback en caso de error
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(id), context.previousProduct);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```


### Zustand Store Modular

**src/stores/cartStore.ts:**

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { Product } from '@/src/hooks/api/useProducts';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
  addedAt: Date;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
}

interface CartActions {
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    immer((set, get) => ({
      // Estado inicial
      items: [],
      total: 0,
      itemCount: 0,
      isLoading: false,

      // Acciones
      addItem: (product, quantity = 1, variant) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            item => item.product.id === product.id && item.selectedVariant === variant
          );

          if (existingIndex >= 0) {
            // Actualizar cantidad si ya existe
            state.items[existingIndex].quantity += quantity;
          } else {
            // Agregar nuevo item
            state.items.push({
              product,
              quantity,
              selectedVariant: variant,
              addedAt: new Date(),
            });
          }

          // Recalcular totales
          state.total = state.items.reduce(
            (sum, item) => sum + (item.product.price * item.quantity), 
            0
          );
          state.itemCount = state.items.reduce(
            (sum, item) => sum + item.quantity, 
            0
          );
        });
      },

      removeItem: (productId) => {
        set((state) => {
          state.items = state.items.filter(item => item.product.id !== productId);
          
          // Recalcular totales
          state.total = state.items.reduce(
            (sum, item) => sum + (item.product.price * item.quantity), 
            0
          );
          state.itemCount = state.items.reduce(
            (sum, item) => sum + item.quantity, 
            0
          );
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Eliminar si cantidad es 0 o menor
            state.items = state.items.filter(item => item.product.id !== productId);
          } else {
            const item = state.items.find(item => item.product.id === productId);
            if (item) {
              item.quantity = quantity;
            }
          }

          // Recalcular totales
          state.total = state.items.reduce(
            (sum, item) => sum + (item.product.price * item.quantity), 
            0
          );
          state.itemCount = state.items.reduce(
            (sum, item) => sum + item.quantity, 
            0
          );
        });
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },

      getItemQuantity: (productId) => {
        const item = get().items.find(item => item.product.id === productId);
        return item?.quantity || 0;
      },

      isInCart: (productId) => {
        return get().items.some(item => item.product.id === productId);
      },
    })),
    {
      name: 'cart-storage',
      version: 1,
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
      }),
    }
  )
);

// Selector hooks para mejor performance
export const useCartItems = () => useCartStore(state => state.items);
export const useCartTotal = () => useCartStore(state => state.total);
export const useCartCount = () => useCartStore(state => state.itemCount);
export const useCartActions = () => useCartStore(state => ({
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
}));
```


***

## Sistema de Diseño Moderno

### NativeWind v4 - Configuración Completa

**tailwind.config.js:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        // iOS: SF Pro, Android: Roboto, Web: System
        'system': ['system-ui', 'sans-serif'],
        'mono': ['ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      spacing: {
        // 4pt grid system
        '18': '72px',
        '88': '352px',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}
```

**metro.config.js:**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**global.css:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom components */
@layer components {
  .btn-primary {
    @apply bg-primary-500 active:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg;
  }
  
  .btn-secondary {
    @apply bg-secondary-200 active:bg-secondary-300 text-secondary-900 font-semibold py-3 px-6 rounded-lg;
  }
  
  .input-base {
    @apply border border-secondary-300 rounded-lg px-4 py-3 text-base bg-white focus:border-primary-500;
  }
}
```


### Componentes Base del Sistema de Diseño

**src/components/ui/Button.tsx:**

```typescript
import React from 'react';
import { 
  Pressable, 
  Text, 
  ActivityIndicator, 
  PressableProps,
  ViewStyle,
  TextStyle 
} from 'react-native';
import { styled } from 'nativewind';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate 
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(styled(Pressable));
const StyledText = styled(Text);

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  textClassName,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const baseClasses = [
    "rounded-lg flex-row items-center justify-center",
    fullWidth && "w-full"
  ].filter(Boolean).join(" ");
  
  const variantClasses = {
    primary: "bg-primary-500 active:bg-primary-600",
    secondary: "bg-secondary-200 active:bg-secondary-300", 
    outline: "border-2 border-primary-500 bg-transparent active:bg-primary-50",
    ghost: "bg-transparent active:bg-secondary-100",
  };
  
  const sizeClasses = {
    sm: "px-3 py-2 min-h-[36px]",
    md: "px-4 py-3 min-h-[44px]",
    lg: "px-6 py-4 min-h-[52px]",
  };
  
  const textVariantClasses = {
    primary: "text-white font-semibold",
    secondary: "text-secondary-900 font-semibold",
    outline: "text-primary-500 font-semibold",
    ghost: "text-secondary-700 font-medium",
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base", 
    lg: "text-lg",
  };

  const isDisabled = disabled || loading;

  const handlePressIn = (event: any) => {
    scale.value = withSpring(0.96);
    opacity.value = withSpring(0.8);
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
    onPressOut?.(event);
  };

  const finalClassName = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    isDisabled && 'opacity-50',
    className
  ].filter(Boolean).join(" ");

  const finalTextClassName = [
    textVariantClasses[variant],
    textSizeClasses[size],
    textClassName
  ].filter(Boolean).join(" ");

  return (
    <AnimatedPressable
      className={finalClassName}
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={loading ? `Loading ${title}` : title}
      {...props}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : undefined} 
          className="mr-2"
        />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <div className="mr-2">{icon}</div>
      )}
      
      <StyledText className={finalTextClassName}>
        {title}
      </StyledText>
      
      {icon && iconPosition === 'right' && !loading && (
        <div className="ml-2">{icon}</div>
      )}
    </AnimatedPressable>
  );
}
```

**src/components/ui/Input.tsx:**

```typescript
import React, { forwardRef, useState } from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  TextInputProps,
  Pressable 
} from 'react-native';
import { styled } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledTextInput = styled(TextInput);
const StyledText = styled(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  required = false,
  className,
  inputClassName,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        [error ? '#ef4444' : '#d4d4d8', error ? '#ef4444' : '#3b82f6']
      ),
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        focusAnim.value,
        [0, 1],
        [error ? '#ef4444' : '#71717a', error ? '#ef4444' : '#3b82f6']
      ),
    };
  });

  const handleFocus = (event: any) => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    onFocus?.(event);
  };

  const handleBlur = (event: any) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    onBlur?.(event);
  };

  const sizeClasses = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const containerClassName = [
    'mb-4',
    className
  ].filter(Boolean).join(' ');

  const inputContainerClasses = [
    'border-2 rounded-lg flex-row items-center px-3',
    sizeClasses[size],
    variant === 'filled' ? 'bg-secondary-50' : 'bg-white',
    disabled && 'opacity-50',
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'flex-1',
    textSizeClasses[size],
    'text-secondary-900',
    leftIcon && 'ml-2',
    rightIcon && 'mr-2',
    inputClassName
  ].filter(Boolean).join(' ');

  return (
    <StyledView className={containerClassName}>
      {label && (
        <AnimatedView style={animatedLabelStyle}>
          <StyledText className="text-sm font-medium mb-2">
            {label}
            {required && <Text className="text-error-500 ml-1">*</Text>}
          </StyledText>
        </AnimatedView>
      )}
      
      <AnimatedView style={[animatedBorderStyle]} className={inputContainerClasses}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={iconSizes[size]} 
            color={error ? '#ef4444' : '#71717a'} 
          />
        )}
        
        <StyledTextInput
          ref={ref}
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          placeholderTextColor="#a1a1aa"
          {...props}
        />
        
        {rightIcon && (
          <Pressable onPress={onRightIconPress} disabled={!onRightIconPress}>
            <Ionicons 
              name={rightIcon} 
              size={iconSizes[size]} 
              color={error ? '#ef4444' : '#71717a'} 
            />
          </Pressable>
        )}
      </AnimatedView>
      
      {error && (
        <StyledText className="text-error-500 text-sm mt-1">
          {error}
        </StyledText>
      )}
      
      {hint && !error && (
        <StyledText className="text-secondary-500 text-sm mt-1">
          {hint}
        </StyledText>
      )}
    </StyledView>
  );
});

Input.displayName = 'Input';
```


### Sistema de Temas

**src/providers/ThemeProvider.tsx:**

```typescript
import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vars } from 'nativewind';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

const lightTheme = {
  '--color-primary': '59 130 246',
  '--color-primary-foreground': '255 255 255',
  '--color-secondary': '244 244 245',
  '--color-secondary-foreground': '39 39 42',
  '--color-background': '255 255 255',
  '--color-foreground': '9 9 11',
  '--color-muted': '244 244 245',
  '--color-muted-foreground': '113 113 122',
  '--color-border': '228 228 231',
  '--color-input': '228 228 231',
  '--color-ring': '59 130 246',
  '--color-destructive': '239 68 68',
  '--color-destructive-foreground': '248 250 252',
};

const darkTheme = {
  '--color-primary': '59 130 246',
  '--color-primary-foreground': '255 255 255',
  '--color-secondary': '39 39 42',
  '--color-secondary-foreground': '244 244 245',
  '--color-background': '9 9 11',
  '--color-foreground': '244 244 245',
  '--color-muted': '39 39 42',
  '--color-muted-foreground': '161 161 170',
  '--color-border': '39 39 42',
  '--color-input': '39 39 42',
  '--color-ring': '59 130 246',
  '--color-destructive': '239 68 68',
  '--color-destructive-foreground': '248 250 252',
};

interface ThemeContextType {
  colorScheme: ColorScheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const { mode, setMode } = useThemeStore();

  const colorScheme: ColorScheme = 
    mode === 'system' ? (systemColorScheme || 'light') : mode;
  
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Aplicar tema CSS variables para NativeWind
    const theme = isDark ? darkTheme : lightTheme;
    // En React Native esto se maneja diferente, pero el concepto es similar
  }, [isDark]);

  return (
    <ThemeContext.Provider 
      value={{ colorScheme, mode, setMode, isDark }}
    >
      <div style={vars(isDark ? darkTheme : lightTheme)}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={isDark ? '#09090b' : '#ffffff'} 
        />
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```


***

## Formularios

### React Hook Form v7.65 + Zod

**Configuración base:**

```bash
npm install react-hook-form zod @hookform/resolvers
```

**src/utils/validation.ts:**

```typescript
import { z } from 'zod';

// Esquemas de validación comunes
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'Email es requerido');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
  .min(10, 'El teléfono debe tener al menos 10 dígitos');

// Esquema de login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña es requerida'),
});

// Esquema de registro
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Esquema de perfil
export const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  bio: z
    .string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional(),
  dateOfBirth: z
    .date()
    .max(new Date(), 'La fecha no puede ser futura')
    .optional(),
  avatar: z
    .string()
    .url('URL de imagen inválida')
    .optional(),
});

// Esquema de checkout
export const checkoutSchema = z.object({
  // Información personal
  firstName: z.string().min(1, 'Nombre es requerido'),
  lastName: z.string().min(1, 'Apellido es requerido'),
  email: emailSchema,
  phone: phoneSchema,
  
  // Dirección de envío
  shippingAddress: z.object({
    street: z.string().min(1, 'Dirección es requerida'),
    city: z.string().min(1, 'Ciudad es requerida'),
    state: z.string().min(1, 'Estado es requerido'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Código postal inválido'),
    country: z.string().min(1, 'País es requerido'),
  }),
  
  // Información de pago
  paymentMethod: z.enum(['card', 'paypal'], {
    required_error: 'Método de pago es requerido',
  }),
  
  // Dirección de facturación
  billingAddressSame: z.boolean(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
}).refine(data => {
  if (!data.billingAddressSame) {
    return data.billingAddress && 
           data.billingAddress.street &&
           data.billingAddress.city &&
           data.billingAddress.state &&
           data.billingAddress.zipCode &&
           data.billingAddress.country;
  }
  return true;
}, {
  message: 'Dirección de facturación es requerida',
  path: ['billingAddress'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
```


### Hook Form Wrapper

**src/hooks/useTypedForm.ts:**

```typescript
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface UseTypedFormProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: z.ZodSchema<T>;
}

export function useTypedForm<T extends FieldValues>({
  schema,
  ...props
}: UseTypedFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validación en tiempo real
    ...props,
  });

  return {
    ...form,
    // Helper para obtener errores de forma tipada
    getError: (field: Path<T>) => form.formState.errors[field],
    // Helper para verificar si un campo tiene error
    hasError: (field: Path<T>) => !!form.formState.errors[field],
  };
}
```


### Componente Controller Wrapper

**src/components/forms/ControlledInput.tsx:**

```typescript
import React from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Input, InputProps } from '@/src/components/ui/Input';

interface ControlledInputProps<T extends FieldValues> extends Omit<InputProps, 'value' | 'onChangeText'> {
  name: FieldPath<T>;
  control: Control<T>;
  defaultValue?: string;
}

export function ControlledInput<T extends FieldValues>({
  name,
  control,
  defaultValue = '',
  ...inputProps
}: ControlledInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...inputProps}
        />
      )}
    />
  );
}
```


### Formulario de Login Completo

**src/components/forms/LoginForm.tsx:**

```typescript
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '@/src/components/ui/Button';
import { ControlledInput } from '@/src/components/forms/ControlledInput';
import { useTypedForm } from '@/src/hooks/useTypedForm';
import { loginSchema, LoginFormData } from '@/src/utils/validation';
import { useAuthStore } from '@/src/features/auth/store/authStore';

const StyledView = styled(View);
const StyledText = styled(Text);

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = '/' }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
    getError,
    reset,
  } = useTypedForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      
      // Limpiar formulario
      reset();
      
      // Callback de éxito
      onSuccess?.();
      
      // Navegar
      router.replace(redirectTo);
      
    } catch (error) {
      Alert.alert(
        'Error de Login',
        error instanceof Error ? error.message : 'Error desconocido',
        [{ text: 'OK' }]
      );
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <StyledView className="flex-1 justify-center px-6 bg-white">
      {/* Header */}
      <StyledView className="mb-8">
        <StyledText className="text-3xl font-bold text-center text-secondary-900 mb-2">
          Bienvenido
        </StyledText>
        <StyledText className="text-base text-center text-secondary-600">
          Inicia sesión para continuar
        </StyledText>
      </StyledView>

      {/* Formulario */}
      <StyledView className="mb-6">
        <ControlledInput
          name="email"
          control={control}
          label="Email"
          placeholder="Ingresa tu email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          leftIcon="mail"
          required
        />

        <ControlledInput
          name="password"
          control={control}
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          secureTextEntry={!showPassword}
          textContentType="password"
          leftIcon="lock-closed"
          rightIcon={showPassword ? "eye-off" : "eye"}
          onRightIconPress={togglePasswordVisibility}
          required
        />
      </StyledView>

      {/* Forgot Password */}
      <Button
        title="¿Olvidaste tu contraseña?"
        variant="ghost"
        size="sm"
        onPress={navigateToForgotPassword}
        className="self-end mb-6"
      />

      {/* Submit Button */}
      <Button
        title="Iniciar Sesión"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={!isValid}
        fullWidth
        className="mb-4"
      />

      {/* Divider */}
      <StyledView className="flex-row items-center my-6">
        <StyledView className="flex-1 h-px bg-secondary-300" />
        <StyledText className="mx-4 text-secondary-500">o</StyledText>
        <StyledView className="flex-1 h-px bg-secondary-300" />
      </StyledView>

      {/* Social Login */}
      <StyledView className="flex-row gap-4 mb-6">
        <Button
          title="Google"
          variant="outline"
          className="flex-1"
          icon={<Ionicons name="logo-google" size={20} />}
          onPress={() => {/* Implement Google login */}}
        />
        <Button
          title="Apple"
          variant="outline"
          className="flex-1"
          icon={<Ionicons name="logo-apple" size={20} />}
          onPress={() => {/* Implement Apple login */}}
        />
      </StyledView>

      {/* Register Link */}
      <StyledView className="flex-row justify-center">
        <StyledText className="text-secondary-600">
          ¿No tienes cuenta?{' '}
        </StyledText>
        <Button
          title="Regístrate"
          variant="ghost"
          size="sm"
          onPress={navigateToRegister}
          className="p-0 min-h-0"
        />
      </StyledView>
    </StyledView>
  );
}
```


### Formulario de Checkout Complejo

**src/components/forms/CheckoutForm.tsx:**

```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui/Button';
import { ControlledInput } from '@/src/components/forms/ControlledInput';
import { useTypedForm } from '@/src/hooks/useTypedForm';
import { checkoutSchema, CheckoutFormData } from '@/src/utils/validation';
import { useCartStore } from '@/src/stores/cartStore';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
}

export function CheckoutForm({ onSubmit }: CheckoutFormProps) {
  const { total, items } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useTypedForm({
    schema: checkoutSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      },
      paymentMethod: 'card',
      billingAddressSame: true,
      billingAddress: undefined,
    },
  });

  const billingAddressSame = watch('billingAddressSame');

  const handleBillingAddressToggle = (value: boolean) => {
    setValue('billingAddressSame', value);
    if (value) {
      setValue('billingAddress', undefined);
    } else {
      setValue('billingAddress', {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      });
    }
  };

  const handleFormSubmit = async (data: CheckoutFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <StyledScrollView className="flex-1 bg-white">
      <StyledView className="p-6">
        {/* Order Summary */}
        <StyledView className="mb-8 p-4 bg-secondary-50 rounded-lg">
          <StyledText className="text-lg font-semibold mb-2">
            Resumen del Pedido
          </StyledText>
          <StyledView className="flex-row justify-between mb-2">
            <StyledText className="text-secondary-600">
              Productos ({items.length})
            </StyledText>
            <StyledText className="font-medium">
              ${total.toFixed(2)}
            </StyledText>
          </StyledView>
          <StyledView className="flex-row justify-between mb-2">
            <StyledText className="text-secondary-600">Envío</StyledText>
            <StyledText className="font-medium">$9.99</StyledText>
          </StyledView>
          <StyledView className="flex-row justify-between pt-2 border-t border-secondary-200">
            <StyledText className="text-lg font-bold">Total</StyledText>
            <StyledText className="text-lg font-bold">
              ${(total + 9.99).toFixed(2)}
            </StyledText>
          </StyledView>
        </StyledView>

        {/* Personal Information */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold mb-4">
            Información Personal
          </StyledText>
          
          <StyledView className="flex-row gap-4">
            <StyledView className="flex-1">
              <ControlledInput
                name="firstName"
                control={control}
                label="Nombre"
                placeholder="Tu nombre"
                autoComplete="given-name"
                required
              />
            </StyledView>
            <StyledView className="flex-1">
              <ControlledInput
                name="lastName"
                control={control}
                label="Apellido"
                placeholder="Tu apellido"
                autoComplete="family-name"
                required
              />
            </StyledView>
          </StyledView>

          <ControlledInput
            name="email"
            control={control}
            label="Email"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon="mail"
            required
          />

          <ControlledInput
            name="phone"
            control={control}
            label="Teléfono"
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            autoComplete="tel"
            leftIcon="call"
            required
          />
        </StyledView>

        {/* Shipping Address */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold mb-4">
            Dirección de Envío
          </StyledText>
          
          <ControlledInput
            name="shippingAddress.street"
            control={control}
            label="Dirección"
            placeholder="123 Main Street"
            autoComplete="street-address"
            required
          />

          <StyledView className="flex-row gap-4">
            <StyledView className="flex-1">
              <ControlledInput
                name="shippingAddress.city"
                control={control}
                label="Ciudad"
                placeholder="Ciudad"
                autoComplete="address-level2"
                required
              />
            </StyledView>
            <StyledView className="flex-1">
              <ControlledInput
                name="shippingAddress.state"
                control={control}
                label="Estado"
                placeholder="Estado"
                autoComplete="address-level1"
                required
              />
            </StyledView>
          </StyledView>

          <ControlledInput
            name="shippingAddress.zipCode"
            control={control}
            label="Código Postal"
            placeholder="12345"
            keyboardType="number-pad"
            autoComplete="postal-code"
            required
          />
        </StyledView>

        {/* Billing Address */}
        <StyledView className="mb-8">
          <StyledView className="flex-row items-center justify-between mb-4">
            <StyledText className="text-xl font-semibold">
              Dirección de Facturación
            </StyledText>
            <StyledView className="flex-row items-center">
              <StyledText className="mr-2 text-secondary-600">
                Igual que envío
              </StyledText>
              <Switch
                value={billingAddressSame}
                onValueChange={handleBillingAddressToggle}
                trackColor={{ false: '#e4e4e7', true: '#3b82f6' }}
                thumbColor={billingAddressSame ? '#ffffff' : '#71717a'}
              />
            </StyledView>
          </StyledView>

          {!billingAddressSame && (
            <>
              <ControlledInput
                name="billingAddress.street"
                control={control}
                label="Dirección"
                placeholder="123 Main Street"
                required
              />

              <StyledView className="flex-row gap-4">
                <StyledView className="flex-1">
                  <ControlledInput
                    name="billingAddress.city"
                    control={control}
                    label="Ciudad"
                    placeholder="Ciudad"
                    required
                  />
                </StyledView>
                <StyledView className="flex-1">
                  <ControlledInput
                    name="billingAddress.state"
                    control={control}
                    label="Estado"
                    placeholder="Estado"
                    required
                  />
                </StyledView>
              </StyledView>

              <ControlledInput
                name="billingAddress.zipCode"
                control={control}
                label="Código Postal"
                placeholder="12345"
                keyboardType="number-pad"
                required
              />
            </>
          )}
        </StyledView>

        {/* Payment Method */}
        <StyledView className="mb-8">
          <StyledText className="text-xl font-semibold mb-4">
            Método de Pago
          </StyledText>
          
          <StyledView className="flex-row gap-4 mb-4">
            <Button
              title="Tarjeta de Crédito"
              variant={paymentMethod === 'card' ? 'primary' : 'outline'}
              className="flex-1"
              icon={<Ionicons name="card" size={20} />}
              onPress={() => {
                setPaymentMethod('card');
                setValue('paymentMethod', 'card');
              }}
            />
            <Button
              title="PayPal"
              variant={paymentMethod === 'paypal' ? 'primary' : 'outline'}
              className="flex-1"
              icon={<Ionicons name="logo-paypal" size={20} />}
              onPress={() => {
                setPaymentMethod('paypal');
                setValue('paymentMethod', 'paypal');
              }}
            />
          </StyledView>

          {paymentMethod === 'card' && (
            <StyledText className="text-sm text-secondary-600 text-center">
              Serás redirigido a nuestro procesador de pagos seguro
            </StyledText>
          )}

          {paymentMethod === 'paypal' && (
            <StyledText className="text-sm text-secondary-600 text-center">
              Serás redirigido a PayPal para completar el pago
            </StyledText>
          )}
        </StyledView>

        {/* Submit */}
        <Button
          title={`Proceder al Pago - $${(total + 9.99).toFixed(2)}`}
          onPress={handleSubmit(handleFormSubmit)}
          loading={isSubmitting}
          fullWidth
          size="lg"
          icon={<Ionicons name="lock-closed" size={20} />}
        />

        {/* Security Notice */}
        <StyledView className="mt-4 p-4 bg-secondary-50 rounded-lg">
          <StyledView className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
            <StyledText className="ml-2 font-semibold text-secondary-900">
              Pago Seguro
            </StyledText>
          </StyledView>
          <StyledText className="text-sm text-secondary-600">
            Tu información está protegida con encriptación SSL de 256 bits. 
            Nunca almacenamos datos de tarjetas de crédito.
          </StyledText>
        </StyledView>
      </StyledView>
    </StyledScrollView>
  );
}
```


***

## Internacionalización

### i18next + React Native - Setup Completo

```bash
npm install i18next react-i18next i18next-browser-languagedetector react-native-localize
```

**src/localization/i18n.ts:**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getLocales } from 'react-native-localize';

// Recursos de traducción
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

// Detectar idioma del dispositivo
const deviceLanguage = getLocales()[^0]?.languageCode || 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    
    // Configuración específica para React Native
    compatibilityJSON: 'v3',
    
    // Debug solo en desarrollo
    debug: __DEV__,
    
    // Interpolación
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    
    // Configuración del detector
    detection: {
      // Orden de detección
      order: ['localStorage', 'navigator'],
      // Cache del idioma seleccionado
      caches: ['localStorage'],
    },
    
    // Namespaces y recursos
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Configuración de React
    react: {
      useSuspense: false, // Evitar problemas con React Native
    },
  });

export default i18n;
```


### Archivos de Traducción

**locales/en/index.ts:**

```typescript
export default {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
  },

  // Navigation
  navigation: {
    home: 'Home',
    search: 'Search',
    profile: 'Profile',
    settings: 'Settings',
    cart: 'Cart',
    orders: 'Orders',
    favorites: 'Favorites',
  },

  // Authentication
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    welcome: 'Welcome',
    welcomeBack: 'Welcome back',
    loginDescription: 'Sign in to continue',
    registerDescription: 'Create your account',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    signInWith: 'Sign in with {{provider}}',
  },

  // Validation
  validation: {
    required: '{{field}} is required',
    email: 'Invalid email address',
    minLength: '{{field}} must be at least {{min}} characters',
    maxLength: '{{field}} cannot exceed {{max}} characters',
    passwordMatch: 'Passwords do not match',
    phoneInvalid: 'Invalid phone number',
    urlInvalid: 'Invalid URL',
  },

  // Products
  products: {
    title: 'Products',
    addToCart: 'Add to Cart',
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    price: 'Price',
    description: 'Description',
    reviews: 'Reviews',
    rating: 'Rating',
    specifications: 'Specifications',
    relatedProducts: 'Related Products',
    recentlyViewed: 'Recently Viewed',
  },

  // Cart
  cart: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    checkout: 'Checkout',
    quantity: 'Quantity',
    remove: 'Remove',
    itemAdded: 'Item added to cart',
    itemRemoved: 'Item removed from cart',
  },

  // Profile
  profile: {
    title: 'Profile',
    personalInfo: 'Personal Information',
    name: 'Name',
    phone: 'Phone',
    bio: 'Bio',
    dateOfBirth: 'Date of Birth',
    avatar: 'Profile Picture',
    address: 'Address',
    orderHistory: 'Order History',
    paymentMethods: 'Payment Methods',
    notifications: 'Notifications',
    privacy: 'Privacy',
    security: 'Security',
    changePassword: 'Change Password',
  },

  // Settings
  settings: {
    title: 'Settings',
    general: 'General',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    privacy: 'Privacy',
    security: 'Security',
    about: 'About',
    version: 'Version',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    contactSupport: 'Contact Support',
    signOut: 'Sign Out',
  },

  // Errors
  errors: {
    generic: 'Something went wrong',
    network: 'Network error. Please check your connection.',
    server: 'Server error. Please try again later.',
    notFound: 'Not found',
    unauthorized: 'Unauthorized access',
    forbidden: 'Access forbidden',
    validation: 'Validation error',
    timeout: 'Request timeout',
  },

  // Date/Time
  datetime: {
    now: 'Now',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This week',
    lastWeek: 'Last week',
    thisMonth: 'This month',
    lastMonth: 'Last month',
    daysAgo: '{{count}} days ago',
    hoursAgo: '{{count}} hours ago',
    minutesAgo: '{{count}} minutes ago',
  },

  // Pluralization
  items: {
    zero: 'No items',
    one: '{{count}} item',
    other: '{{count}} items',
  },

  reviews_one: '{{count}} review',
  reviews_other: '{{count}} reviews',
};
```

**locales/es/index.ts:**

```typescript
export default {
  // Common
  common: {
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    back: 'Atrás',
    next: 'Siguiente',
    finish: 'Finalizar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    refresh: 'Actualizar',
  },

  // Navigation
  navigation: {
    home: 'Inicio',
    search: 'Buscar',
    profile: 'Perfil',
    settings: 'Configuración',
    cart: 'Carrito',
    orders: 'Pedidos',
    favorites: 'Favoritos',
  },

  // Authentication
  auth: {
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    register: 'Registrarse',
    email: 'Correo',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetPassword: 'Restablecer Contraseña',
    welcome: 'Bienvenido',
    welcomeBack: 'Bienvenido de nuevo',
    loginDescription: 'Inicia sesión para continuar',
    registerDescription: 'Crea tu cuenta',
    dontHaveAccount: '¿No tienes cuenta?',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    signInWith: 'Iniciar sesión con {{provider}}',
  },

  // Validation
  validation: {
    required: '{{field}} es requerido',
    email: 'Dirección de correo inválida',
    minLength: '{{field}} debe tener al menos {{min}} caracteres',
    maxLength: '{{field}} no puede exceder {{max}} caracteres',
    passwordMatch: 'Las contraseñas no coinciden',
    phoneInvalid: 'Número de teléfono inválido',
    urlInvalid: 'URL inválida',
  },

  // Products
  products: {
    title: 'Productos',
    addToCart: 'Añadir al Carrito',
    addToFavorites: 'Añadir a Favoritos',
    removeFromFavorites: 'Quitar de Favoritos',
    outOfStock: 'Agotado',
    inStock: 'Disponible',
    price: 'Precio',
    description: 'Descripción',
    reviews: 'Reseñas',
    rating: 'Calificación',
    specifications: 'Especificaciones',
    relatedProducts: 'Productos Relacionados',
    recentlyViewed: 'Vistos Recientemente',
  },

  // Cart
  cart: {
    title: 'Carrito de Compras',
    empty: 'Tu carrito está vacío',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    tax: 'Impuestos',
    checkout: 'Proceder al Pago',
    quantity: 'Cantidad',
    remove: 'Eliminar',
    itemAdded: 'Producto añadido al carrito',
    itemRemoved: 'Producto eliminado del carrito',
  },

  // Profile
  profile: {
    title: 'Perfil',
    personalInfo: 'Información Personal',
    name: 'Nombre',
    phone: 'Teléfono',
    bio: 'Biografía',
    dateOfBirth: 'Fecha de Nacimiento',
    avatar: 'Foto de Perfil',
    address: 'Dirección',
    orderHistory: 'Historial de Pedidos',
    paymentMethods: 'Métodos de Pago',
    notifications: 'Notificaciones',
    privacy: 'Privacidad',
    security: 'Seguridad',
    changePassword: 'Cambiar Contraseña',
  },

  // Settings
  settings: {
    title: 'Configuración',
    general: 'General',
    language: 'Idioma',
    theme: 'Tema',
    notifications: 'Notificaciones',
    privacy: 'Privacidad',
    security: 'Seguridad',
    about: 'Acerca de',
    version: 'Versión',
    termsOfService: 'Términos de Servicio',
    privacyPolicy: 'Política de Privacidad',
    contactSupport: 'Contactar Soporte',
    signOut: 'Cerrar Sesión',
  },

  // Errors
  errors: {
    generic: 'Algo salió mal',
    network: 'Error de red. Verifica tu conexión.',
    server: 'Error del servidor. Inténtalo más tarde.',
    notFound: 'No encontrado',
    unauthorized: 'Acceso no autorizado',
    forbidden: 'Acceso prohibido',
    validation: 'Error de validación',
    timeout: 'Tiempo de espera agotado',
  },

  // Date/Time
  datetime: {
    now: 'Ahora',
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    thisWeek: 'Esta semana',
    lastWeek: 'La semana pasada',
    thisMonth: 'Este mes',
    lastMonth: 'El mes pasado',
    daysAgo: 'Hace {{count}} días',
    hoursAgo: 'Hace {{count}} horas',
    minutesAgo: 'Hace {{count}} minutos',
  },

  // Pluralization
  items: {
    zero: 'Sin elementos',
    one: '{{count}} elemento',
    other: '{{count}} elementos',
  },

  reviews_one: '{{count}} reseña',
  reviews_other: '{{count}} reseñas',
};
```


### Hook de Traducción Personalizado

**src/hooks/useTranslation.ts:**

```typescript
import { useTranslation as useI18nTranslation, TFunction } from 'react-i18next';
import { getLocales } from 'react-native-localize';

interface ExtendedTranslation {
  t: TFunction;
  i18n: any;
  ready: boolean;
  currentLanguage: string;
  isRTL: boolean;
  changeLanguage: (lng: string) => Promise<TFunction>;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date) => string;
}

export function useTranslation(ns?: string): ExtendedTranslation {
  const { t, i18n, ready } = useI18nTranslation(ns);
  
  const currentLanguage = i18n.language;
  const isRTL = ['ar', 'he', 'fa'].includes(currentLanguage);
  
  const changeLanguage = async (lng: string) => {
    return await i18n.changeLanguage(lng);
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    return new Intl.DateTimeFormat(
      currentLanguage, 
      { ...defaultOptions, ...options }
    ).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('datetime.now');
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return t('datetime.minutesAgo', { count: diffInMinutes });
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t('datetime.hoursAgo', { count: diffInHours });
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return t('datetime.yesterday');
    }
    
    if (diffInDays < 7) {
      return t('datetime.daysAgo', { count: diffInDays });
    }
    
    return formatDate(date);
  };

  return {
    t,
    i18n,
    ready,
    currentLanguage,
    isRTL,
    changeLanguage,
    formatCurrency,
    formatDate,
    formatRelativeTime,
  };
}
```


### Componente de Selección de Idioma

**src/components/LanguageSelector.tsx:**

```typescript
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Button } from '@/src/components/ui/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledPressable = styled(Pressable);

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage);

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsModalVisible(false);
      return;
    }

    setIsChanging(true);
    try {
      await changeLanguage(languageCode);
      onLanguageChange?.(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
      setIsModalVisible(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        title={`${currentLang?.flag} ${currentLang?.name || 'Language'}`}
        variant="outline"
        onPress={() => setIsModalVisible(true)}
        icon={<Ionicons name="chevron-down" size={16} />}
        iconPosition="right"
      />

      {/* Language Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <StyledView className="flex-1 bg-white">
          {/* Header */}
          <StyledView className="flex-row items-center justify-between p-6 border-b border-secondary-200">
            <StyledText className="text-xl font-semibold">
              {t('settings.language')}
            </StyledText>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#71717a" />
            </Pressable>
          </StyledView>

          {/* Language List */}
          <StyledScrollView className="flex-1">
            {LANGUAGES.map((language) => {
              const isSelected = language.code === currentLanguage;
              const isLoading = isChanging && language.code !== currentLanguage;

              return (
                <StyledPressable
                  key={language.code}
                  className={`
                    flex-row items-center justify-between p-4 border-b border-secondary-100
                    ${isSelected ? 'bg-primary-50' : ''}
                    ${isLoading ? 'opacity-50' : ''}
                  `}
                  onPress={() => handleLanguageSelect(language.code)}
                  disabled={isLoading}
                >
                  <StyledView className="flex-row items-center">
                    <StyledText className="text-2xl mr-3">
                      {language.flag}
                    </StyledText>
                    <StyledText 
                      className={`text-base ${isSelected ? 'text-primary-600 font-semibold' : 'text-secondary-900'}`}
                    >
                      {language.name}
                    </StyledText>
                  </StyledView>

                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </StyledPressable>
              );
            })}
          </StyledScrollView>

          {/* Note */}
          <StyledView className="p-6 bg-secondary-50">
            <StyledText className="text-sm text-secondary-600 text-center">
              {t('settings.languageNote', 'Changes will take effect immediately')}
            </StyledText>
          </StyledView>
        </StyledView>
      </Modal>
    </>
  );
}
```


### Carga Diferida de Traducciones

**src/localization/lazyLoader.ts:**

```typescript
import i18n from 'i18next';

// Función para cargar traducciones de forma diferida
export async function loadTranslation(language: string, namespace?: string) {
  const ns = namespace || 'translation';
  
  try {
    // Verificar si ya está cargado
    if (i18n.hasResourceBundle(language, ns)) {
      return;
    }

    // Importar dinámicamente la traducción
    let translation;
    
    switch (language) {
      case 'en':
        translation = await import('./locales/en');
        break;
      case 'es':
        translation = await import('./locales/es');
        break;
      case 'fr':
        translation = await import('./locales/fr');
        break;
      default:
        // Fallback a inglés
        translation = await import('./locales/en');
        break;
    }

    // Añadir recursos al i18n
    i18n.addResourceBundle(language, ns, translation.default, true, true);
    
  } catch (error) {
    console.error(`Error loading translation for ${language}:`, error);
  }
}

// Hook para cargar traducciones bajo demanda
export function useLazyTranslation(language: string, namespace?: string) {
  React.useEffect(() => {
    loadTranslation(language, namespace);
  }, [language, namespace]);
}
```


***

## Rendimiento y Nueva Arquitectura

### Configuración Nueva Arquitectura

**React Native 0.82+ ya viene con la Nueva Arquitectura habilitada por defecto.** Para proyectos que actualicen desde versiones anteriores:[^1]

**android/gradle.properties:**

```properties
# Nueva Arquitectura (habilitado por defecto en RN 0.82+)
newArchEnabled=true

# Hermes (habilitado por defecto)
hermesEnabled=true

# Configuraciones de rendimiento
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx4096M -XX:MaxMetaspaceSize=512m
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

**ios/Podfile:**

```ruby
# Nueva Arquitectura (habilitado por defecto en RN 0.82+)
ENV['RCT_NEW_ARCH_ENABLED'] = '1'

# Hermes (habilitado por defecto)
ENV['USE_HERMES'] = '1'

# Optimizaciones de build
ENV['USE_FRAMEWORKS'] = 'static'

target 'MiApp' do
  config = use_native_modules!
  
  use_react_native!(
    :path => config[:reactNativePath],
    # Hermes is now enabled by default
    :hermes_enabled => flags[:hermes_enabled],
    :fabric_enabled => flags[:fabric_enabled],
    # Flipper configuration (deprecated, use React DevTools)
    :flipper_configuration => FlipperConfiguration.disabled
  )
end
```


### Optimizaciones de Rendimiento

**src/utils/performance.ts:**

```typescript
import { InteractionManager, Alert } from 'react-native';
import { isRunningInExpoGo } from 'expo-constants';

// Configuración de performance
export const PERFORMANCE_CONFIG = {
  // Thresholds para alertas de performance
  JS_FRAME_DROP_THRESHOLD: 0.95, // 95% frame rate
  MEMORY_WARNING_THRESHOLD: 0.85, // 85% memoria
  BUNDLE_SIZE_WARNING: 50, // MB
  
  // Configuraciones de lazy loading
  LAZY_LOAD_THRESHOLD: 3, // pantallas
  IMAGE_LAZY_DISTANCE: 500, // px
  
  // Timeouts
  API_TIMEOUT: 10000, // 10s
  IMAGE_LOAD_TIMEOUT: 5000, // 5s
};

// Monitor de performance
class PerformanceMonitor {
  private frameDropCount = 0;
  private totalFrames = 0;
  private memoryWarningShown = false;

  init() {
    if (__DEV__ && !isRunningInExpoGo()) {
      this.startFrameRateMonitoring();
      this.startMemoryMonitoring();
    }
  }

  private startFrameRateMonitoring() {
    const monitor = () => {
      this.totalFrames++;
      
      // Simular detección de frame drops
      // En una implementación real, usarías APIs nativas
      const frameRate = this.calculateFrameRate();
      
      if (frameRate < PERFORMANCE_CONFIG.JS_FRAME_DROP_THRESHOLD) {
        this.frameDropCount++;
        
        if (this.frameDropCount > 10) {
          console.warn('🚨 Performance Warning: Frame drops detected');
          this.frameDropCount = 0; // Reset
        }
      }
      
      InteractionManager.runAfterInteractions(() => {
        setTimeout(monitor, 16); // ~60fps
      });
    };
    
    monitor();
  }

  private startMemoryMonitoring() {
    const checkMemory = () => {
      // En una implementación real, usarías APIs nativas para memoria
      const memoryUsage = this.getMemoryUsage();
      
      if (memoryUsage > PERFORMANCE_CONFIG.MEMORY_WARNING_THRESHOLD && 
          !this.memoryWarningShown) {
        console.warn('🚨 Memory Warning: High memory usage detected');
        this.memoryWarningShown = true;
        
        // Reset flag después de 30 segundos
        setTimeout(() => {
          this.memoryWarningShown = false;
        }, 30000);
      }
      
      setTimeout(checkMemory, 5000); // Check every 5s
    };
    
    checkMemory();
  }

  private calculateFrameRate(): number {
    // Implementación simplificada
    return 0.98; // 98% frame rate simulado
  }

  private getMemoryUsage(): number {
    // Implementación simplificada
    return Math.random() * 0.9; // Uso de memoria simulado
  }

  // Método para reportar métricas customizadas
  reportCustomMetric(name: string, value: number, unit: string) {
    if (__DEV__) {
      console.log(`📊 Performance: ${name}: ${value}${unit}`);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper para medición de tiempo
export function measureTime<T>(
  operation: () => T | Promise<T>, 
  name: string
): Promise<T> {
  const startTime = Date.now();
  
  const finish = (result: T) => {
    const duration = Date.now() - startTime;
    performanceMonitor.reportCustomMetric(name, duration, 'ms');
    return result;
  };

  try {
    const result = operation();
    
    if (result instanceof Promise) {
      return result.then(finish);
    }
    
    return Promise.resolve(finish(result));
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Performance: ${name} failed after ${duration}ms`, error);
    throw error;
  }
}

// Hook para medir renders
export function useRenderTime(componentName: string) {
  React.useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const renderTime = Date.now() - startTime;
      performanceMonitor.reportCustomMetric(
        `${componentName}_render`, 
        renderTime, 
        'ms'
      );
    };
  });
}
```


### Optimización de Componentes

**src/components/optimized/OptimizedFlatList.tsx:**

```typescript
import React, { useMemo, useCallback } from 'react';
import { 
  FlatList, 
  FlatListProps, 
  View, 
  Text,
  Dimensions,
  ListRenderItem 
} from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: ListRenderItem<T>;
  estimatedItemSize?: number;
  overscanCount?: number;
  useWindowedRendering?: boolean;
}

export function OptimizedFlatList<T>({
  data,
  renderItem,
  estimatedItemSize = 100,
  overscanCount = 3,
  useWindowedRendering = true,
  keyExtractor,
  ...props
}: OptimizedFlatListProps<T>) {
  
  // Memoizar configuraciones de optimización
  const optimizationProps = useMemo(() => {
    const itemCount = data?.length || 0;
    const windowSize = Math.max(1, Math.ceil(SCREEN_HEIGHT / estimatedItemSize));
    
    return {
      // Core optimizations
      removeClippedSubviews: itemCount > 20,
      maxToRenderPerBatch: Math.min(10, windowSize),
      initialNumToRender: Math.min(15, itemCount),
      windowSize: useWindowedRendering ? windowSize + overscanCount * 2 : itemCount,
      updateCellsBatchingPeriod: 100,
      
      // Scroll optimizations
      scrollEventThrottle: 16,
      disableIntervalMomentum: true,
      disableScrollViewPanResponder: false,
      
      // Memory optimizations
      getItemLayout: props.getItemLayout || ((data, index) => ({
        length: estimatedItemSize,
        offset: estimatedItemSize * index,
        index,
      })),
    };
  }, [data?.length, estimatedItemSize, overscanCount, useWindowedRendering, props.getItemLayout]);

  // Memoizar keyExtractor
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      // Fallback para objetos con id
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return String((item as any).id);
      }
      return String(index);
    },
    [keyExtractor]
  );

  // Componente de item vacío para performance
  const EmptyComponent = useMemo(() => (
    <StyledView className="flex-1 items-center justify-center py-16">
      <StyledText className="text-secondary-500 text-center">
        No items to display
      </StyledText>
    </StyledView>
  ), []);

  // Loading footer
  const LoadingFooter = useMemo(() => (
    <StyledView className="py-4 items-center">
      <StyledText className="text-secondary-500">Loading more...</StyledText>
    </StyledView>
  ), []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={memoizedKeyExtractor}
      ListEmptyComponent={EmptyComponent}
      ListFooterComponent={props.onEndReached ? LoadingFooter : undefined}
      {...optimizationProps}
      {...props}
    />
  );
}

// Hook para virtual scrolling manual
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollOffset, setScrollOffset] = React.useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollOffset / itemHeight);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollOffset + containerHeight) / itemHeight)
    );
    
    return items.slice(
      Math.max(0, startIndex - 3), // Overscan
      endIndex + 3 // Overscan
    ).map((item, index) => ({
      item,
      index: startIndex + index,
      key: `item-${startIndex + index}`,
    }));
  }, [items, scrollOffset, itemHeight, containerHeight]);

  const handleScroll = useCallback((event: any) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
  };
}
```


### Optimización de Imágenes

**src/components/optimized/OptimizedImage.tsx:**

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Image, 
  ImageProps, 
  View, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { styled } from 'nativewind';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming,
  runOnJS 
} from 'react-native-reanimated';

const StyledView = styled(View);
const AnimatedImage = Animated.createAnimatedComponent(Image);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: string;
  fallback?: string;
  lazy?: boolean;
  cachePolicy?: 'default' | 'reload' | 'force-cache' | 'only-if-cached';
  quality?: 'low' | 'medium' | 'high';
  sizes?: {
    small: string;
    medium: string;
    large: string;
  };
  onLoad?: () => void;
  onError?: () => void;
  showLoadingIndicator?: boolean;
  className?: string;
}

export function OptimizedImage({
  source,
  placeholder,
  fallback,
  lazy = false,
  cachePolicy = 'default',
  quality = 'medium',
  sizes,
  onLoad,
  onError,
  showLoadingIndicator = true,
  className,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.05);

  // Seleccionar source apropiado basado en tamaño de pantalla
  const optimizedSource = useMemo(() => {
    if (typeof source === 'number') {
      return source;
    }

    if (sizes) {
      const screenWidth = SCREEN_WIDTH;
      let selectedSize: string;
      
      if (screenWidth < 400) {
        selectedSize = sizes.small;
      } else if (screenWidth < 800) {
        selectedSize = sizes.medium;
      } else {
        selectedSize = sizes.large;
      }
      
      return { uri: selectedSize };
    }

    // Optimización de calidad
    const uri = source.uri;
    if (uri.includes('unsplash.com')) {
      const qualityParams = {
        low: '&q=60&w=400',
        medium: '&q=75&w=800', 
        high: '&q=90&w=1200'
      };
      
      return { 
        uri: `${uri}${qualityParams[quality]}`,
        cache: cachePolicy 
      };
    }

    return source;
  }, [source, sizes, quality, cachePolicy]);

  // Animación de entrada
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });
    
    runOnJS(() => {
      onLoad?.();
    })();
  }, [opacity, scale, onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Lazy loading observer
  const handleViewableChange = useCallback((inView: boolean) => {
    if (lazy && !isInView && inView) {
      setIsInView(true);
    }
  }, [lazy, isInView]);

  // Determinar qué mostrar
  const sourceToShow = hasError && fallback 
    ? { uri: fallback } 
    : (isInView ? optimizedSource : (placeholder ? { uri: placeholder } : undefined));

  if (!sourceToShow) {
    return (
      <StyledView 
        className={`bg-secondary-200 items-center justify-center ${className}`}
        style={style}
      >
        {showLoadingIndicator && <ActivityIndicator />}
      </StyledView>
    );
  }

  return (
    <StyledView className={className} style={style}>
      <AnimatedImage
        source={sourceToShow}
        style={[
          { width: '100%', height: '100%' },
          animatedStyle
        ]}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {isLoading && showLoadingIndicator && (
        <StyledView className="absolute inset-0 items-center justify-center bg-secondary-100">
          <ActivityIndicator size="small" />
        </StyledView>
      )}
    </StyledView>
  );
}

// Hook para intersection observer (lazy loading)
export function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '100px'
) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    
    // Implementación simplificada para React Native
    // En una implementación real, usarías react-native-intersection-observer
    // o implementarías tu propia lógica con onLayout y scroll events
    
    const timer = setTimeout(() => {
      setIsInView(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return [ref, isInView];
}
```


***

## Seguridad y Privacidad

### Almacenamiento Seguro

**src/infrastructure/storage/secureStorage.ts:**

```typescript
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface SecureStorageOptions {
  requireAuthentication?: boolean;
  showModal?: boolean;
  promptMessage?: string;
  keychainService?: string;
  sharedPreferencesName?: string;
}

class SecureStorageService {
  private defaultOptions: SecureStorageOptions = {
    requireAuthentication: false,
    keychainService: 'MiAppKeychain',
    sharedPreferencesName: 'MiAppPreferences',
  };

  async setSecure(
    key: string, 
    value: string, 
    options?: SecureStorageOptions
  ): Promise<void> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };
      
      await SecureStore.setItemAsync(key, value, {
        requireAuthentication: finalOptions.requireAuthentication,
        authenticationPrompt: finalOptions.promptMessage || 'Autenticar para acceder',
        keychainService: finalOptions.keychainService,
        sharedPreferencesName: finalOptions.sharedPreferencesName,
      });
    } catch (error) {
      console.error(`Error storing secure item ${key}:`, error);
      throw new Error(`Failed to store secure item: ${key}`);
    }
  }

  async getSecure(
    key: string, 
    options?: SecureStorageOptions
  ): Promise<string | null> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };
      
      return await SecureStore.getItemAsync(key, {
        requireAuthentication: finalOptions.requireAuthentication,
        authenticationPrompt: finalOptions.promptMessage || 'Autenticar para acceder',
        keychainService: finalOptions.keychainService,
        sharedPreferencesName: finalOptions.sharedPreferencesName,
      });
    } catch (error) {
      console.error(`Error retrieving secure item ${key}:`, error);
      return null;
    }
  }

  async deleteSecure(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key, {
        keychainService: this.defaultOptions.keychainService,
        sharedPreferencesName: this.defaultOptions.sharedPreferencesName,
      });
    } catch (error) {
      console.error(`Error deleting secure item ${key}:`, error);
      throw new Error(`Failed to delete secure item: ${key}`);
    }
  }

  // Método para verificar disponibilidad de biometría
  async isBiometricsAvailable(): Promise<boolean> {
    try {
      const result = await SecureStore.canUseBiometricAuthenticationAsync();
      return result;
    } catch (error) {
      console.error('Error checking biometrics availability:', error);
      return false;
    }
  }

  // Método para almacenar datos sensibles con biometría requerida
  async setBiometricSecure(
    key: string, 
    value: string,
    promptMessage?: string
  ): Promise<void> {
    const isBiometricsAvailable = await this.isBiometricsAvailable();
    
    if (!isBiometricsAvailable) {
      throw new Error('Biometric authentication not available');
    }

    return this.setSecure(key, value, {
      requireAuthentication: true,
      promptMessage: promptMessage || 'Use su huella dactilar o Face ID para continuar',
    });
  }

  // Método para almacenar múltiples items de forma segura
  async setMultipleSecure(
    items: Array<{ key: string; value: string }>,
    options?: SecureStorageOptions
  ): Promise<void> {
    const promises = items.map(item => 
      this.setSecure(item.key, item.value, options)
    );
    
    await Promise.all(promises);
  }

  // Método para limpiar todos los datos seguros de la app
  async clearAll(): Promise<void> {
    try {
      // Lista de keys conocidas a limpiar
      const keysToDelete = [
        'auth_token',
        'refresh_token',
        'user_credentials',
        'biometric_data',
        'api_keys',
      ];

      const deletePromises = keysToDelete.map(key => 
        this.deleteSecure(key).catch(err => {
          // Ignorar errores si la key no existe
          console.log(`Key ${key} not found or already deleted`);
        })
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw new Error('Failed to clear secure storage');
    }
  }
}

export const secureStorage = new SecureStorageService();

// Wrapper para datos específicos
export class AuthStorage {
  private static TOKEN_KEY = 'auth_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static USER_CREDENTIALS_KEY = 'user_credentials';

  static async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      secureStorage.setSecure(this.TOKEN_KEY, accessToken),
      secureStorage.setSecure(this.REFRESH_TOKEN_KEY, refreshToken),
    ]);
  }

  static async getAccessToken(): Promise<string | null> {
    return secureStorage.getSecure(this.TOKEN_KEY);
  }

  static async getRefreshToken(): Promise<string | null> {
    return secureStorage.getSecure(this.REFRESH_TOKEN_KEY);
  }

  static async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.deleteSecure(this.TOKEN_KEY),
      secureStorage.deleteSecure(this.REFRESH_TOKEN_KEY),
    ]);
  }

  static async storeCredentials(
    email: string, 
    encryptedPassword: string
  ): Promise<void> {
    const credentials = JSON.stringify({ email, encryptedPassword });
    await secureStorage.setBiometricSecure(
      this.USER_CREDENTIALS_KEY, 
      credentials,
      'Autentique para guardar credenciales'
    );
  }

  static async getCredentials(): Promise<{email: string; encryptedPassword: string} | null> {
    try {
      const credentialsStr = await secureStorage.getSecure(
        this.USER_CREDENTIALS_KEY, 
        {
          requireAuthentication: true,
          promptMessage: 'Autentique para acceder a credenciales guardadas'
        }
      );
      
      return credentialsStr ? JSON.parse(credentialsStr) : null;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }
}
```


### Gestión de Secretos y Configuración

**app.json (configuración segura):**

```json
{
  "expo": {
    "name": "MiApp",
    "slug": "mi-app",
    "version": "1.0.0",
    "plugins": [
      [
        "expo-secure-store",
        {
          "faceIDPermission": "Esta app usa Face ID para autenticación segura."
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "enableProguardInReleaseBuilds": true,
            "enableShrinkResourcesInReleaseBuilds": true,
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "minSdkVersion": 24
          },
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**eas.json (configuración de build segura):**

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "API_URL": "https://api-dev.miapp.com",
        "API_KEY": "dev-api-key"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://api-staging.miapp.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "API_URL": "https://api.miapp.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "../secrets/play-store-service-account.json",
        "track": "internal"
      }
    }
  }
}
```


### Network Security y SSL Pinning

**src/infrastructure/api/networkSecurity.ts:**

```typescript
import { Platform } from 'react-native';

// Configuración de SSL Pinning (requiere configuración nativa)
export const SSL_PINNING_CONFIG = {
  'api.miapp.com': {
    certificateHash: 'SHA256:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    publicKeyHash: 'SHA256:YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  },
  'auth.miapp.com': {
    certificateHash: 'SHA256:ZZZZZZZZZZZZZZZ
<span style="display:none">[^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^70][^71][^72][^73][^74][^75][^76][^77][^78][^79][^80][^81][^82][^83][^84][^85]</span>

<div align="center">⁂</div>

[^1]: https://reactnative.dev/blog/2025/10/08/react-native-0.82
[^2]: https://expo.dev/changelog/sdk-54
[^3]: https://docs.expo.dev/router/introduction/
[^4]: https://dev.to/cristiansifuentes/react-state-management-in-2025-context-api-vs-zustand-385m
[^5]: https://dev.to/inam003/tanstack-query-v5-guide-features-benefits-and-how-its-used-36nk
[^6]: https://dev.to/y3asin/react-native-expo-with-nativewind-v4-and-typescript-38j3
[^7]: https://blog.logrocket.com/react-hook-form-vs-react-19/
[^8]: https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/
[^9]: https://dev.to/berthaw82414312/react-native-in-2025-detox-or-appium-2g3l
[^10]: https://github.com/facebook/flipper
[^11]: https://developer.apple.com/news/upcoming-requirements/?id=02212025a
[^12]: https://expo.dev/changelog/sdk-54-beta
[^13]: https://github.com/react-native-community/discussions-and-proposals/discussions/812
[^14]: https://reactnative.dev/blog/2025/01/21/version-0.77
[^15]: https://reactnavigation.org/blog/2024/11/06/react-navigation-7.0/
[^16]: https://www.reddit.com/r/expo/comments/1ndpzg5/expo_sdk_54_changelog_and_upgrade_guide/
[^17]: https://200oksolutions.com/blog/react-native-in-2025-key-developments-and-future-potential/
[^18]: https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture
[^19]: https://www.esparkinfo.com/blog/future-of-react-native
[^20]: https://reactnative.dev/docs/releases
[^21]: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
[^22]: https://endoflife.date/react-native
[^23]: https://javascript.plainenglish.io/how-to-learn-react-native-in-2025-the-perfect-roadmap-b27c37535621
[^24]: https://github.com/expo/expo/issues/39233
[^25]: https://roadmap.sh/react-native
[^26]: https://www.youtube.com/watch?v=1_J4xJk6XSc
[^27]: https://reactnative.dev/versions
[^28]: https://blog.mrinalmaheshwari.com/react-native-1-0-whats-real-what-s-rumour-what-s-likely-402f39372406
[^29]: https://www.callstack.com/events/live-dev-session-week-34
[^30]: https://www.npmjs.com/package/react-native?activeTab=versions
[^31]: https://dreamix.eu/insights/tanstack-query-v5-migration-made-easy-key-aspects-breaking-changes/
[^32]: https://www.youtube.com/watch?v=Jof7mxZWD3A
[^33]: https://github.com/react-hook-form/react-hook-form/releases
[^34]: https://github.com/TanStack/query/discussions/4252
[^35]: https://www.youtube.com/watch?v=3H2ZJ383h3s
[^36]: https://github.com/orgs/react-hook-form/discussions/9716
[^37]: https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5
[^38]: https://github.com/nativewind/nativewind/issues/1182
[^39]: https://www.reddit.com/r/reactjs/comments/mifkdx/react_hook_form_v7/
[^40]: https://github.com/tanstack/query/releases
[^41]: https://www.nativewind.dev/docs/getting-started/installation
[^42]: https://www.jsdelivr.com/package/npm/react-hook-form-v7
[^43]: https://tanstack.com/query
[^44]: https://www.nativewind.dev
[^45]: https://www.npmjs.com/package/react-hook-form
[^46]: https://blog.cubed.run/react-query-vs-swr-vs-tanstack-query-what-should-you-use-in-2025-983da8c450fe
[^47]: https://www.reddit.com/r/reactnative/comments/1i8xsh0/thoughts_on_nativewind_v4/
[^48]: https://developer.apple.com/app-store/review/guidelines/
[^49]: https://support.google.com/googleplay/android-developer/answer/16296680?hl=en
[^50]: https://developer.apple.com/news/
[^51]: https://support.google.com/googleplay/android-developer/table/12921780?hl=en
[^52]: https://developer.apple.com/news/upcoming-requirements/
[^53]: https://adapty.io/blog/how-to-pass-app-store-review/
[^54]: https://play.google/developer-content-policy/
[^55]: https://dev.to/raphacmartin/dont-panic-what-apples-ios-18-sdk-update-really-means-for-your-app-5cj2
[^56]: https://appfollow.io/blog/app-store-review-guidelines
[^57]: https://play.google.com/console/about/newsletter/play-monthly/2025/06-play/
[^58]: https://expo.dev/blog/apple-sdk-minimum-requirements
[^59]: https://www.igeeksblog.com/app-store-updated-policy/
[^60]: https://developer.android.com/distribute/play-policies
[^61]: https://www.reddit.com/r/expo/comments/1k76evf/apple_now_requires_xcode_16_ios_18_sdk_for_app/
[^62]: https://nextnative.dev/blog/app-store-review-guidelines
[^63]: https://android-developers.googleblog.com/2025/08/elevating-android-security.html
[^64]: https://clients.gmed.com/2024/10/11/changes-in-minimum-ios-system-requirements-for-q2-2025/
[^65]: https://netscapelabs.com/2025/08/27/apple-app-store-review-guidelines-update-2025-what-developers-really-need-to-know/
[^66]: https://developer.android.com/newsletter/play-monthly/2025/content/april
[^67]: https://dev.to/anilparmar/how-to-add-internationalization-i18n-to-a-react-app-using-i18next-2025-edition-3hkk
[^68]: https://stackoverflow.com/questions/40797011/how-to-store-sensitive-data-in-react-native-or-expo-code-with-keychain-and-k
[^69]: https://www.browserstack.com/guide/detox-testing-tutorial
[^70]: https://phrase.com/blog/posts/localizing-react-apps-with-i18next/
[^71]: https://docs.expo.dev/versions/latest/sdk/securestore/
[^72]: https://testomat.io/blog/end-to-end-detox-testing-overview-of-test-automation-tool/
[^73]: https://centus.com/blog/react-i18next-localization
[^74]: https://www.reddit.com/r/reactnative/comments/16obp80/does_exposecurestore_is_enough/
[^75]: https://www.netguru.com/blog/detox-tool-react-native
[^76]: https://github.com/i18next/react-i18next
[^77]: https://dev.to/snehasishkonger/methods-of-storing-local-data-in-react-native-expo-mc0
[^78]: https://geekyants.com/blog/key-benefits-of-detox-automation-for-testers
[^79]: https://dev.to/luizrebelatto/i18n-internationalization-in-react-native-2k42
[^80]: https://reactnative.dev/docs/security
[^81]: https://github.com/wix/Detox
[^82]: https://linguidoor.com/react-native-localization-made-easy-in-2025/
[^83]: https://www.devitpl.com/mobile-application-development/react-native-security-best-practices/
[^84]: https://softwarehouse.au/blog/end-to-end-testing-with-detox-a-comprehensive-guide/
[^85]: https://www.glorywebs.com/blog/internationalization-in-react```

