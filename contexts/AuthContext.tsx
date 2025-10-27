'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    phone?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar sesión inicial
  useEffect(() => {
    const checkSession = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name,
            phone: session.user.user_metadata?.phone,
          });
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe a cambios de autenticación
    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name,
            phone: session.user.user_metadata?.phone,
          });
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase no está configurado');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name,
          phone: data.user.user_metadata?.phone,
        });
      }
    } catch (err: any) {
      console.error('Sign in error:', err);

      // Traducir errores comunes de Supabase al español
      let errorMessage = 'Error al iniciar sesión';

      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Debes confirmar tu email antes de iniciar sesión.';
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = 'El formato del email no es válido.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName?: string,
      phone?: string
    ) => {
      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase no está configurado');
        return;
      }

      try {
        setError(null);
        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Si requiere confirmación por email, mostrar mensaje
          if (data.user.identities && data.user.identities.length === 0) {
            setError('Por favor, confirma tu email para continuar');
          }
        }
      } catch (err: any) {
        console.error('Sign up error:', err);

        // Traducir errores comunes de Supabase al español
        let errorMessage = 'Error al crear cuenta';

        if (err.message?.includes('User already registered')) {
          errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
        } else if (err.message?.includes('Password should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (err.message?.includes('Invalid email')) {
          errorMessage = 'El formato del email no es válido.';
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Error al cerrar sesión');
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase no está configurado');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) throw resetError;
    } catch (err: any) {
      console.error('Reset password error:', err);

      // Traducir errores comunes de Supabase al español
      let errorMessage = 'Error al enviar email de recuperación';

      if (err.message?.includes('Invalid email')) {
        errorMessage = 'El formato del email no es válido.';
      } else if (err.message?.includes('User not found')) {
        errorMessage = 'No existe una cuenta con este email.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
