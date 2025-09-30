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
      chat_messages: {
        Row: {
          ai_extracted_item: string | null
          ai_extracted_price: number | null
          ai_intent_score: number | null
          ai_intent_type: string | null
          ai_sentiment: string | null
          ai_urgency_level: string | null
          created_at: string
          follow_up_sent_at: string | null
          follow_up_status: string
          id: string
          message_text: string
          platform_user_id: string
          platform_username: string | null
          revenue_attributed: number | null
          stream_id: string
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_extracted_item?: string | null
          ai_extracted_price?: number | null
          ai_intent_score?: number | null
          ai_intent_type?: string | null
          ai_sentiment?: string | null
          ai_urgency_level?: string | null
          created_at?: string
          follow_up_sent_at?: string | null
          follow_up_status?: string
          id?: string
          message_text: string
          platform_user_id: string
          platform_username?: string | null
          revenue_attributed?: number | null
          stream_id: string
          timestamp?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_extracted_item?: string | null
          ai_extracted_price?: number | null
          ai_intent_score?: number | null
          ai_intent_type?: string | null
          ai_sentiment?: string | null
          ai_urgency_level?: string | null
          created_at?: string
          follow_up_sent_at?: string | null
          follow_up_status?: string
          id?: string
          message_text?: string
          platform_user_id?: string
          platform_username?: string | null
          revenue_attributed?: number | null
          stream_id?: string
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_templates: {
        Row: {
          created_at: string
          id: string
          intent_type: string
          placeholders: string[] | null
          success_rate: number | null
          template_content: string
          template_name: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent_type: string
          placeholders?: string[] | null
          success_rate?: number | null
          template_content: string
          template_name: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intent_type?: string
          placeholders?: string[] | null
          success_rate?: number | null
          template_content?: string
          template_name?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          created_at: string
          ended_at: string | null
          high_intent_leads: number
          id: string
          is_active: boolean
          platform: string
          revenue_generated: number | null
          started_at: string
          stream_title: string
          total_messages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          high_intent_leads?: number
          id?: string
          is_active?: boolean
          platform: string
          revenue_generated?: number | null
          started_at?: string
          stream_title: string
          total_messages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          high_intent_leads?: number
          id?: string
          is_active?: boolean
          platform?: string
          revenue_generated?: number | null
          started_at?: string
          stream_title?: string
          total_messages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stream_analytics: {
        Row: {
          avg_intent_score: number | null
          buy_intent_count: number
          created_at: string
          hour_bucket: string
          id: string
          messages_count: number
          peak_activity_time: string | null
          question_count: number
          stream_id: string
          unique_viewers: number
          user_id: string
        }
        Insert: {
          avg_intent_score?: number | null
          buy_intent_count?: number
          created_at?: string
          hour_bucket: string
          id?: string
          messages_count?: number
          peak_activity_time?: string | null
          question_count?: number
          stream_id: string
          unique_viewers?: number
          user_id: string
        }
        Update: {
          avg_intent_score?: number | null
          buy_intent_count?: number
          created_at?: string
          hour_bucket?: string
          id?: string
          messages_count?: number
          peak_activity_time?: string | null
          question_count?: number
          stream_id?: string
          unique_viewers?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_stream_stats: {
        Args: { is_high_intent?: boolean; stream_id: string }
        Returns: undefined
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
