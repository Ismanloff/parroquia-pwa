export interface Saint {
  date: string;
  name: string;
  bio: string;
  source?: Record<string, unknown> | null;
  updated_at: string;
}

export interface Gospel {
  date: string;
  title: string;
  passage: string;
  content: string;
  source?: Record<string, unknown> | null;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  meta?: Record<string, unknown> | null;
  updated_at: string;
}

export interface Session {
  user: {
    id: string;
    email: string;
  };
  access_token: string;
  expires_at: string;
}
