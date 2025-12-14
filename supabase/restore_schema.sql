-- RESTORE DATABASE SCHEMA
-- Generated based on types/database.ts and known requirements

-- 1. Table: Saints (Santos del día)
CREATE TABLE IF NOT EXISTS public.saints (
    date DATE PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT NOT NULL,
    source JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to saints" ON public.saints
    FOR SELECT TO anon, authenticated USING (true);

-- 2. Table: Gospels (Evangelios del día)
CREATE TABLE IF NOT EXISTS public.gospels (
    date DATE PRIMARY KEY,
    title TEXT NOT NULL,
    passage TEXT NOT NULL,
    content TEXT NOT NULL,
    source JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gospels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to gospels" ON public.gospels
    FOR SELECT TO anon, authenticated USING (true);

-- 3. Table: Events (Eventos privados de usuario)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own events" ON public.events
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Table: Public Events (Eventos parroquiales públicos)
CREATE TABLE IF NOT EXISTS public.public_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    location TEXT,
    meta JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to public_events" ON public.public_events
    FOR SELECT TO anon, authenticated USING (true);

-- 5. Table: Push Tokens (Notificaciones)
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir INSERT de tokens" ON public.push_tokens
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Solo admin puede leer tokens" ON public.push_tokens
  FOR SELECT TO service_role USING (true);

-- Helpful comments
COMMENT ON TABLE public.saints IS 'Santoral diario';
COMMENT ON TABLE public.gospels IS 'Evangelio diario';
COMMENT ON TABLE public.events IS 'Eventos privados de los usuarios';
COMMENT ON TABLE public.public_events IS 'Eventos públicos de la parroquia';
