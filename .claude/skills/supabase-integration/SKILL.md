# Supabase Integration Skill

## Stack Supabase
- **@supabase/supabase-js:** 2.75.0
- **Persistencia:** @react-native-async-storage/async-storage 2.2.0
- **Autenticación:** Auth con sesión persistente
- **Database:** PostgreSQL con tipos TypeScript generados

## Cuándo Usar Este Skill
- ✅ Configurar cliente Supabase
- ✅ Implementar autenticación
- ✅ Realizar queries a la base de datos
- ✅ Manejar errores de Supabase
- ✅ Configurar tipos TypeScript desde DB

---

## CONFIGURACIÓN DEL CLIENTE

### Cliente Frontend (lib/supabase.ts)
```typescript
// ✅ CORRECTO - Cliente con persistencia AsyncStorage
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Variables de Entorno
```env
# .env o app.config.js
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

## AUTENTICACIÓN CON CONTEXT

### AuthContext Pattern (contexts/AuthContext.tsx)
```typescript
// ✅ CORRECTO - Context de autenticación completo
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar sesión
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de autenticación');
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
      throw new Error(message);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://reset-password',
      });
      
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al resetear contraseña';
      setError(message);
      throw new Error(message);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(session);
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
```

### Uso en App Root Layout (app/_layout.tsx)
```typescript
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        {/* ... */}
      </Stack>
    </AuthProvider>
  );
}
```

---

## QUERIES OPTIMIZADAS

### Patrón con React Query
```typescript
// ✅ CORRECTO - Query tipada con Supabase
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Saint } from '@/types';

export const useSaint = (date: string) => {
  return useQuery({
    queryKey: ['saint', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saints')
        .select('*')
        .eq('date', date)
        .single();
      
      if (error) {
        // Error PGRST116 = No rows found (es OK)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data as Saint;
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    retry: (failureCount, error: any) => {
      // No reintentar si no hay datos
      if (error?.code === 'PGRST116') return false;
      return failureCount < 2;
    },
  });
};
```

### Mutation con React Query
```typescript
// ✅ CORRECTO - Mutación para crear evento
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserEvent } from '@/types';

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<UserEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar cache de eventos
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      console.error('Error creando evento:', error);
    },
  });
};
```

---

## MANEJO DE ERRORES

### Helper de Errores
```typescript
// ✅ CORRECTO - lib/supabaseErrors.ts
export const getSupabaseErrorMessage = (error: any): string => {
  if (!error) return 'Error desconocido';
  
  // Errores de autenticación
  if (error.message?.includes('Invalid login credentials')) {
    return 'Credenciales inválidas';
  }
  if (error.message?.includes('User already registered')) {
    return 'El email ya está registrado';
  }
  if (error.message?.includes('Email not confirmed')) {
    return 'Por favor confirma tu email';
  }
  
  // Errores de base de datos
  if (error.code === 'PGRST116') {
    return 'No se encontraron resultados';
  }
  if (error.code === '23505') {
    return 'Este registro ya existe';
  }
  if (error.code === '23503') {
    return 'Referencia inválida';
  }
  
  // Error genérico
  return error.message || 'Ha ocurrido un error';
};
```

### Uso en Componentes
```typescript
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors';

try {
  await signIn(email, password);
} catch (error) {
  const message = getSupabaseErrorMessage(error);
  Alert.alert('Error', message);
}
```

---

## TIPOS TYPESCRIPT DESDE DB

### Generar Tipos (types/database.ts)
```typescript
// ✅ CORRECTO - Tipos generados desde Supabase
// Generar con: npx supabase gen types typescript --project-id xxx > types/database.ts

export interface Database {
  public: {
    Tables: {
      saints: {
        Row: {
          date: string;
          name: string;
          bio: string;
          source: string | null;
          updated_at: string | null;
        };
        Insert: Omit<saints_Row, 'updated_at'>;
        Update: Partial<saints_Row>;
      };
      gospels: {
        Row: {
          date: string;
          title: string;
          passage: string;
          content: string;
          source: string | null;
          updated_at: string | null;
        };
        Insert: Omit<gospels_Row, 'updated_at'>;
        Update: Partial<gospels_Row>;
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          location: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<events_Row, 'id' | 'created_at'>;
        Update: Partial<events_Row>;
      };
      public_events: {
        Row: {
          id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          location: string | null;
          meta: Record<string, any> | null;
          updated_at: string;
        };
        Insert: Omit<public_events_Row, 'id' | 'updated_at'>;
        Update: Partial<public_events_Row>;
      };
    };
  };
}
```

### Usar Tipos en Queries
```typescript
import type { Database } from '@/types/database';

type Saint = Database['public']['Tables']['saints']['Row'];
type SaintInsert = Database['public']['Tables']['saints']['Insert'];

const { data } = await supabase
  .from('saints')
  .select('*')
  .returns<Saint[]>();
```

---

## ROW LEVEL SECURITY (RLS)

### Políticas Recomendadas
```sql
-- ✅ CORRECTO - Políticas de seguridad

-- Santos: Solo lectura pública
CREATE POLICY "Santos públicos" ON saints
  FOR SELECT USING (true);

-- Evangelios: Solo lectura pública
CREATE POLICY "Evangelios públicos" ON gospels
  FOR SELECT USING (true);

-- Eventos privados: Usuario solo ve sus eventos
CREATE POLICY "Usuarios ven sus eventos" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sus eventos" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios editan sus eventos" ON events
  FOR UPDATE USING (auth.uid() = user_id);

-- Eventos públicos: Solo lectura
CREATE POLICY "Eventos públicos visibles" ON public_events
  FOR SELECT USING (true);
```

---

## REAL-TIME SUBSCRIPTIONS

### Suscripción a Cambios
```typescript
// ✅ CORRECTO - Escuchar cambios en tiempo real
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useRealtimeEvents = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('public-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_events',
        },
        (payload) => {
          console.log('Cambio en eventos:', payload);
          // Invalidar cache
          queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
```

---

## CHECKLIST DE SEGURIDAD

- [ ] ✅ Usar `EXPO_PUBLIC_*` para variables de entorno del cliente
- [ ] ✅ NUNCA exponer `SUPABASE_SERVICE_ROLE_KEY` en el frontend
- [ ] ✅ Todas las tablas tienen RLS habilitado
- [ ] ✅ Políticas RLS prueban con `auth.uid()`
- [ ] ✅ Validar datos antes de insertar
- [ ] ✅ Manejar errores de Supabase explícitamente
- [ ] ✅ Usar tipos generados de la base de datos

---

## COMANDOS ÚTILES

```bash
# Generar tipos TypeScript desde Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts

# Iniciar Supabase local
npx supabase start

# Ejecutar migraciones
npx supabase db push

# Ver logs de Supabase
npx supabase functions logs
```

---

## EJEMPLOS COMPLETOS

### Login Screen
```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    try {
      await signIn(email, password);
      // Navegación automática por auth state change
    } catch (err) {
      Alert.alert('Error', getSupabaseErrorMessage(err));
    }
  };
  
  return (
    <View>
      <Input value={email} onChangeText={setEmail} />
      <Input value={password} onChangeText={setPassword} secureTextEntry />
      <Button onPress={handleLogin} loading={loading} />
    </View>
  );
}
```
