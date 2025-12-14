// Supabase Admin Client - Para operaciones del lado del servidor
// Usa Service Role Key para acceso completo (bypasa RLS)
// Inicialización LAZY para evitar errores de build cuando faltan variables de entorno

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Verifica si Supabase Admin está correctamente configurado
 */
export function isSupabaseAdminConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Obtiene el cliente Supabase Admin (inicializa si es necesario)
 * @throws Error si Supabase Admin no está configurado
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      'Supabase Admin no está configurado. Agrega SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY a tu .env'
    );
  }

  supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}
