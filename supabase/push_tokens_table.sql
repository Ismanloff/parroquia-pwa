-- Tabla para almacenar tokens FCM de Push Notifications
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Crear tabla push_tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);

-- Índice para limpiar tokens antiguos
CREATE INDEX IF NOT EXISTS idx_push_tokens_last_used ON public.push_tokens(last_used);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Permitir INSERT desde cualquier cliente autenticado o anónimo
-- (necesario para que los usuarios puedan guardar sus tokens)
CREATE POLICY "Permitir INSERT de tokens" ON public.push_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Solo service_role puede leer tokens (para enviar notificaciones)
CREATE POLICY "Solo admin puede leer tokens" ON public.push_tokens
  FOR SELECT
  TO service_role
  USING (true);

-- Política: Solo service_role puede actualizar tokens
CREATE POLICY "Solo admin puede actualizar tokens" ON public.push_tokens
  FOR UPDATE
  TO service_role
  USING (true);

-- Política: Solo service_role puede eliminar tokens
CREATE POLICY "Solo admin puede eliminar tokens" ON public.push_tokens
  FOR DELETE
  TO service_role
  USING (true);

-- Función para limpiar tokens antiguos (más de 90 días sin uso)
CREATE OR REPLACE FUNCTION clean_old_push_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.push_tokens
  WHERE last_used < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comentarios en la tabla
COMMENT ON TABLE public.push_tokens IS 'Tokens FCM para enviar push notifications a dispositivos instalados';
COMMENT ON COLUMN public.push_tokens.token IS 'Token FCM único del dispositivo';
COMMENT ON COLUMN public.push_tokens.user_agent IS 'User agent del navegador/dispositivo';
COMMENT ON COLUMN public.push_tokens.last_used IS 'Última vez que se usó este token';
