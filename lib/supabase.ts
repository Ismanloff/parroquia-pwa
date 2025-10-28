import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let client: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // ✅ Persistir sesión en localStorage
      autoRefreshToken: true, // ✅ Refrescar token automáticamente
      detectSessionInUrl: true, // ✅ Detectar sesión en URL (OAuth redirects)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'parroquia-auth-token',
    },
  });
} else {
  console.warn(
    'Supabase configuration missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = client;
export const isSupabaseConfigured = Boolean(client);
export const missingSupabaseConfigMessage =
  'Supabase no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY a tu archivo .env.';
