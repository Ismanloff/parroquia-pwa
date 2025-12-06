export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      saints: {
        Row: {
          date: string;
          name: string;
          bio: string;
          source: Json | null;
          updated_at: string;
        };
        Insert: {
          date: string;
          name: string;
          bio: string;
          source?: Json | null;
          updated_at?: string;
        };
        Update: {
          date?: string;
          name?: string;
          bio?: string;
          source?: Json | null;
          updated_at?: string;
        };
      };
      gospels: {
        Row: {
          date: string;
          title: string;
          passage: string;
          content: string;
          source: Json | null;
          updated_at: string;
        };
        Insert: {
          date: string;
          title: string;
          passage: string;
          content: string;
          source?: Json | null;
          updated_at?: string;
        };
        Update: {
          date?: string;
          title?: string;
          passage?: string;
          content?: string;
          source?: Json | null;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          starts_at?: string;
          ends_at?: string | null;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      public_events: {
        Row: {
          id: string;
          title: string;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          meta: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          starts_at: string;
          ends_at?: string | null;
          location?: string | null;
          meta?: Json | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          starts_at?: string;
          ends_at?: string | null;
          location?: string | null;
          meta?: Json | null;
          updated_at?: string;
        };
      };
    };
  };
}
