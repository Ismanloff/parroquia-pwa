export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      workspace_settings: {
        Row: {
          id: string
          workspace_id: string
          chatbot_name: string
          welcome_message: string
          language: string
          tone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          chatbot_name: string
          welcome_message: string
          language: string
          tone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          chatbot_name?: string
          welcome_message?: string
          language?: string
          tone?: string
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_progress: {
        Row: {
          id: string
          workspace_id: string
          current_step: number
          completed_steps: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          current_step: number
          completed_steps: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          current_step?: number
          completed_steps?: Json
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          workspace_id: string
          filename: string
          file_url: string
          file_size: number
          mime_type: string
          status: string
          uploaded_by: string
          chunk_count: number | null
          processed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          filename: string
          file_url: string
          file_size: number
          mime_type: string
          status: string
          uploaded_by: string
          chunk_count?: number | null
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          filename?: string
          file_url?: string
          file_size?: number
          mime_type?: string
          status?: string
          uploaded_by?: string
          chunk_count?: number | null
          processed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          workspace_id: string
          pinecone_id: string
          content: string
          chunk_index: number
          token_count: number
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          workspace_id: string
          pinecone_id: string
          content: string
          chunk_index: number
          token_count: number
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          workspace_id?: string
          pinecone_id?: string
          content?: string
          chunk_index?: number
          token_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
