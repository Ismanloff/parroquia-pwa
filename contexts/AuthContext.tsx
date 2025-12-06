import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  isSupabaseConfigured,
  missingSupabaseConfigMessage,
  supabase,
} from '@/lib/supabase';

type Profile = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
};

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isSupabaseConfigured: boolean;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  error: null,
  isSupabaseConfigured,
  refreshSession: async () => { /* no-op */ },
  signIn: async () => { /* no-op */ },
  signUp: async () => { /* no-op */ },
  signOut: async () => { /* no-op */ },
  resetPassword: async () => { /* no-op */ },
  updateProfile: async () => { /* no-op */ },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  }, []);

  const fetchSession = useCallback(async () => {
    if (!supabase) {
      setError(missingSupabaseConfigMessage);
      setSession(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setSession(null);
        setProfile(null);
      } else {
        setError(null);
        setSession(data.session ?? null);
        if (data.session?.user) {
          await fetchProfile(data.session.user.id);
        } else {
          setProfile(null);
        }
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudo recuperar la sesión de Supabase.',
      );
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    await fetchSession();
  }, [fetchSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error(missingSupabaseConfigMessage);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data.session);
    if (data.user) {
      await fetchProfile(data.user.id);
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string, phone?: string) => {
    if (!supabase) throw new Error(missingSupabaseConfigMessage);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          phone: phone || '',
        },
      },
    });

    if (error) throw error;

    // El perfil se crea automáticamente por el trigger de Supabase
    // (handle_new_user trigger en auth.users)
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error(missingSupabaseConfigMessage);

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error(missingSupabaseConfigMessage);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://reset-password',
    });

    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!supabase) throw new Error(missingSupabaseConfigMessage);
    if (!session?.user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);

    if (error) throw error;

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, [session]);

  useEffect(() => {
    void fetchSession();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [fetchSession]);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      error,
      isSupabaseConfigured,
      refreshSession,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
    }),
    [session, profile, loading, error, refreshSession, signIn, signUp, signOut, resetPassword, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
