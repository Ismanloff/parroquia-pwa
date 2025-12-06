# Parroquias - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON=your-anon-key-here
EXPO_PUBLIC_API_BASE=https://your-backend.com
EXPO_PUBLIC_CHATKIT_WORKFLOW_ID=your-chatkit-workflow-id
EXPO_PUBLIC_TIMEZONE=Europe/Madrid
```

### 3. Set Up Supabase Database

Run this SQL in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Saints table
CREATE TABLE saints (
  date DATE PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  source JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gospels table
CREATE TABLE gospels (
  date DATE PRIMARY KEY,
  title TEXT NOT NULL,
  passage TEXT NOT NULL,
  content TEXT NOT NULL,
  source JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table (user events)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public events table
CREATE TABLE public_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  meta JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_public_events_starts_at ON public_events(starts_at);

-- Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saints ENABLE ROW LEVEL SECURITY;
ALTER TABLE gospels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for public_events (read-only)
CREATE POLICY "Anyone can view public events"
  ON public_events FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for saints and gospels (read-only)
CREATE POLICY "Anyone can view saints"
  ON saints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view gospels"
  ON gospels FOR SELECT
  TO authenticated
  USING (true);
```

### 4. Add Sample Data (Optional)

```sql
INSERT INTO saints (date, name, bio) VALUES
  ('2025-01-15', 'San Pablo, ermitaño', 'Primer ermitaño cristiano que vivió en el desierto de Egipto durante más de 90 años, dedicando su vida a la oración y la contemplación.'),
  ('2025-01-16', 'San Marcelo I, papa', 'Papa y mártir del siglo IV que defendió la fe durante las persecuciones romanas.');

INSERT INTO gospels (date, title, passage, content) VALUES
  ('2025-01-15', 'Jesús sana a un leproso', 'Marcos 1, 40-45', 'Se acercó a Jesús un leproso, suplicándole de rodillas: "Si quieres, puedes limpiarme." Sintiendo lástima, extendió la mano y lo tocó, diciendo: "Quiero: queda limpio."'),
  ('2025-01-16', 'La curación del paralítico', 'Marcos 2, 1-12', 'Cuando Jesús volvió a Cafarnaún, corrió la voz de que estaba en casa. Acudieron tantos que no quedaba sitio ni a la puerta.');

INSERT INTO public_events (title, starts_at, ends_at, location) VALUES
  ('Misa Dominical', '2025-01-19 10:00:00+01', '2025-01-19 11:00:00+01', 'Iglesia Principal'),
  ('Catequesis', '2025-01-20 18:00:00+01', '2025-01-20 19:30:00+01', 'Salón Parroquial');
```

### 5. Start Development Server

```bash
# Web preview
bun run start-web

# Mobile (scan QR with Expo Go)
bun run start

# iOS Simulator
bun run start -- --ios

# Android Emulator
bun run start -- --android
```

## Backend API (Optional)

The app works without a backend, but these endpoints enable additional features:

### ChatKit Session
```
POST ${EXPO_PUBLIC_API_BASE}/api/chatkit/session
Response: { client_secret: string }
```

### Google Calendar OAuth
```
GET ${EXPO_PUBLIC_API_BASE}/api/gcal/oauth/start
Opens OAuth flow
```

### Google Calendar Sync
```
POST ${EXPO_PUBLIC_API_BASE}/api/gcal/sync
Response: { ok: boolean, synced: number }
```

## Authentication

### Test Login (Development)
Use the "Test Login" button - no Supabase setup required.

### Email/Password Login
1. Create user in Supabase dashboard (Authentication > Users > Add User)
2. Or implement signup flow in the app

## Troubleshooting

### No content showing
- Check environment variables are set
- Verify Supabase tables exist
- Insert sample data
- Check date format is `YYYY-MM-DD`

### Authentication errors
- Verify Supabase URL and anon key
- Check RLS policies are enabled
- Ensure user exists in Supabase

### Chat not loading
- Backend must be running
- Check `EXPO_PUBLIC_API_BASE` is correct
- Verify `EXPO_PUBLIC_CHATKIT_WORKFLOW_ID` is set

## Next Steps

1. Populate saints and gospels tables with real data
2. Set up backend for Google Calendar integration
3. Configure ChatKit workflow
4. Customize theme in `constants/theme.ts`
5. Add more features as needed
