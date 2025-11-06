export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown
          resource_id: string
          resource_type: string
          success: boolean | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id: string
          resource_type: string
          success?: boolean | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string
          resource_type?: string
          success?: boolean | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          conversations_limit: number
          conversations_used: number | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          plan: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          conversations_limit: number
          conversations_used?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          plan: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          conversations_limit?: number
          conversations_used?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          connected_at: string | null
          credentials: Json | null
          deleted_at: string | null
          error_message: string | null
          id: string
          last_synced_at: string | null
          name: string | null
          status: string | null
          type: string
          whatsapp_access_token: string | null
          whatsapp_business_account_id: string | null
          whatsapp_phone_number_id: string | null
          whatsapp_webhook_verify_token: string | null
          workspace_id: string | null
        }
        Insert: {
          connected_at?: string | null
          credentials?: Json | null
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string | null
          status?: string | null
          type: string
          whatsapp_access_token?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_phone_number_id?: string | null
          whatsapp_webhook_verify_token?: string | null
          workspace_id?: string | null
        }
        Update: {
          connected_at?: string | null
          credentials?: Json | null
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string | null
          status?: string | null
          type?: string
          whatsapp_access_token?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_phone_number_id?: string | null
          whatsapp_webhook_verify_token?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          channel_id: string | null
          closed_at: string | null
          created_at: string | null
          customer_metadata: Json | null
          customer_name: string | null
          customer_phone: string | null
          deleted_at: string | null
          id: string
          last_message_at: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          channel_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_metadata?: Json | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          channel_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_metadata?: Json | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          deleted_at: string | null
          document_id: string | null
          id: string
          pinecone_id: string
          token_count: number | null
          workspace_id: string | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          deleted_at?: string | null
          document_id?: string | null
          id?: string
          pinecone_id: string
          token_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          document_id?: string | null
          id?: string
          pinecone_id?: string
          token_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chunk_count: number | null
          deleted_at: string | null
          error_message: string | null
          file_size: number | null
          file_url: string
          filename: string
          id: string
          mime_type: string | null
          processed_at: string | null
          status: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          workspace_id: string | null
        }
        Insert: {
          chunk_count?: number | null
          deleted_at?: string | null
          error_message?: string | null
          file_size?: number | null
          file_url: string
          filename: string
          id?: string
          mime_type?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          chunk_count?: number | null
          deleted_at?: string | null
          error_message?: string | null
          file_size?: number | null
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_response: boolean | null
          confidence_score: number | null
          content: string
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          media_url: string | null
          message_type: string | null
          sender_id: string | null
          sender_type: string
          sources_used: Json | null
        }
        Insert: {
          ai_response?: boolean | null
          confidence_score?: number | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          media_url?: string | null
          message_type?: string | null
          sender_id?: string | null
          sender_type: string
          sources_used?: Json | null
        }
        Update: {
          ai_response?: boolean | null
          confidence_score?: number | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          media_url?: string | null
          message_type?: string | null
          sender_id?: string | null
          sender_type?: string
          sources_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_steps: string[] | null
          current_step: number | null
          skipped_steps: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_steps?: string[] | null
          current_step?: number | null
          skipped_steps?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_steps?: string[] | null
          current_step?: number | null
          skipped_steps?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_policy_logs: {
        Row: {
          details: Json | null
          error_message: string | null
          execution_time: string
          id: string
          job_name: string
          records_affected: number | null
          status: string | null
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          execution_time?: string
          id?: string
          job_name: string
          records_affected?: number | null
          status?: string | null
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          execution_time?: string
          id?: string
          job_name?: string
          records_affected?: number | null
          status?: string | null
        }
        Relationships: []
      }
      widget_settings: {
        Row: {
          auto_open: boolean | null
          auto_open_delay: number | null
          bot_avatar: string | null
          bot_name: string | null
          created_at: string
          custom_css: string | null
          id: string
          play_sound: boolean | null
          position: string | null
          primary_color: string | null
          secondary_color: string | null
          show_branding: boolean | null
          updated_at: string
          welcome_message: string | null
          workspace_id: string
        }
        Insert: {
          auto_open?: boolean | null
          auto_open_delay?: number | null
          bot_avatar?: string | null
          bot_name?: string | null
          created_at?: string
          custom_css?: string | null
          id?: string
          play_sound?: boolean | null
          position?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_branding?: boolean | null
          updated_at?: string
          welcome_message?: string | null
          workspace_id: string
        }
        Update: {
          auto_open?: boolean | null
          auto_open_delay?: number | null
          bot_avatar?: string | null
          bot_name?: string | null
          created_at?: string
          custom_css?: string | null
          id?: string
          play_sound?: boolean | null
          position?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_branding?: boolean | null
          updated_at?: string
          welcome_message?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          invited_at: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          invited_at?: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          invited_at?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          ai_enabled: boolean | null
          ai_instructions: string | null
          business_hours: Json | null
          chatbot_name: string | null
          handoff_conditions: Json | null
          language: string | null
          out_of_hours_message: string | null
          tone: string | null
          updated_at: string | null
          welcome_message: string | null
          workspace_id: string
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_instructions?: string | null
          business_hours?: Json | null
          chatbot_name?: string | null
          handoff_conditions?: Json | null
          language?: string | null
          out_of_hours_message?: string | null
          tone?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          workspace_id: string
        }
        Update: {
          ai_enabled?: boolean | null
          ai_instructions?: string | null
          business_hours?: Json | null
          chatbot_name?: string | null
          handoff_conditions?: Json | null
          language?: string | null
          out_of_hours_message?: string | null
          tone?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          ai_model: string | null
          ai_temperature: number | null
          billing_status: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          pinecone_namespace: string | null
          plan: string | null
          primary_color: string | null
          slug: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_temperature?: number | null
          billing_status?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pinecone_namespace?: string | null
          plan?: string | null
          primary_color?: string | null
          slug: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_temperature?: number | null
          billing_status?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pinecone_namespace?: string | null
          plan?: string | null
          primary_color?: string | null
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: {
          logs_anonymized: number
          summary: string
        }[]
      }
      check_workspace_membership: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: boolean
      }
      check_workspace_role: {
        Args: {
          p_required_role: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: boolean
      }
      cleanup_old_soft_deleted: {
        Args: Record<PropertyKey, never>
        Returns: {
          chunks_deleted: number
          conversations_deleted: number
          documents_deleted: number
          messages_deleted: number
          summary: string
        }[]
      }
      cleanup_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          sessions_deleted: number
          summary: string
        }[]
      }
      get_audit_stats: {
        Args: { p_workspace_id: string }
        Returns: {
          action: string
          count: number
          last_occurrence: string
        }[]
      }
      get_cron_job_history: {
        Args: { p_job_name?: string }
        Returns: {
          job_name: string
          return_message: string
          run_end: string
          run_start: string
          status: string
        }[]
      }
      get_logs_for_anonymization: {
        Args: Record<PropertyKey, never>
        Returns: {
          age_days: number
          id: string
          log_timestamp: string
        }[]
      }
      get_scheduled_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          command: string
          database: string
          job_id: number
          job_name: string
          schedule: string
        }[]
      }
      get_security_events: {
        Args: { p_hours_ago?: number; p_workspace_id?: string }
        Returns: {
          action: string
          details: Json
          id: string
          ip_address: unknown
          log_timestamp: string
          log_user_id: string
          resource_id: string
          resource_type: string
        }[]
      }
      get_soft_deleted_stats: {
        Args: { p_workspace_id?: string }
        Returns: {
          count: number
          oldest_deletion: string
          resource_type: string
        }[]
      }
      get_user_workspaces: {
        Args: { user_uuid: string }
        Returns: {
          role: string
          workspace_id: string
        }[]
      }
      has_workspace_permission: {
        Args: {
          required_role?: string
          user_uuid: string
          workspace_uuid: string
        }
        Returns: boolean
      }
      restore_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      soft_delete_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      soft_delete_document: {
        Args: { p_document_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
