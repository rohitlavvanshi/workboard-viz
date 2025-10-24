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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          chat_history: string | null
          client: number | null
          created_at: string
          email: string | null
          id: number
          meeting_date: string | null
          name: string | null
          phone: string | null
          reminder: string | null
          thread_id: string | null
        }
        Insert: {
          chat_history?: string | null
          client?: number | null
          created_at?: string
          email?: string | null
          id?: number
          meeting_date?: string | null
          name?: string | null
          phone?: string | null
          reminder?: string | null
          thread_id?: string | null
        }
        Update: {
          chat_history?: string | null
          client?: number | null
          created_at?: string
          email?: string | null
          id?: number
          meeting_date?: string | null
          name?: string | null
          phone?: string | null
          reminder?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_client_fkey"
            columns: ["client"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_name: string | null
          "company name": string | null
          created_at: string
          email: string | null
          id: number
        }
        Insert: {
          client_name?: string | null
          "company name"?: string | null
          created_at?: string
          email?: string | null
          id?: number
        }
        Update: {
          client_name?: string | null
          "company name"?: string | null
          created_at?: string
          email?: string | null
          id?: number
        }
        Relationships: []
      }
      new_bot: {
        Row: {
          chathistory: string | null
          created_at: string
          id: number
          name: string | null
          phone: string | null
          thread_id: string | null
        }
        Insert: {
          chathistory?: string | null
          created_at?: string
          id?: number
          name?: string | null
          phone?: string | null
          thread_id?: string | null
        }
        Update: {
          chathistory?: string | null
          created_at?: string
          id?: number
          name?: string | null
          phone?: string | null
          thread_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          chat_history: string | null
          chat_status: Database["public"]["Enums"]["chat_status"] | null
          created_at: string
          description: string | null
          frequency: Database["public"]["Enums"]["task_frequency"] | null
          id: number
          status: string | null
          title: string | null
          user_id: number
        }
        Insert: {
          chat_history?: string | null
          chat_status?: Database["public"]["Enums"]["chat_status"] | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["task_frequency"] | null
          id?: number
          status?: string | null
          title?: string | null
          user_id: number
        }
        Update: {
          chat_history?: string | null
          chat_status?: Database["public"]["Enums"]["chat_status"] | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["task_frequency"] | null
          id?: number
          status?: string | null
          title?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          chat_history: string | null
          created_at: string
          id: number
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["role"] | null
        }
        Insert: {
          chat_history?: string | null
          created_at?: string
          id?: number
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role"] | null
        }
        Update: {
          chat_history?: string | null
          created_at?: string
          id?: number
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      chat_status: "open" | "closed"
      role: "employee" | "technician" | "manager"
      task_frequency:
        | "one_time"
        | "monthly"
        | "quarterly"
        | "semi_annually"
        | "annually"
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
    Enums: {
      chat_status: ["open", "closed"],
      role: ["employee", "technician", "manager"],
      task_frequency: [
        "one_time",
        "monthly",
        "quarterly",
        "semi_annually",
        "annually",
      ],
    },
  },
} as const
