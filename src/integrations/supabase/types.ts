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
          created_at: string
          email: string | null
          id: number
          meeting_date: string | null
          name: string | null
          notes: string | null
          phone: string | null
          project_id: string | null
          reminder: string | null
          thread_id: string | null
        }
        Insert: {
          chat_history?: string | null
          created_at?: string
          email?: string | null
          id?: number
          meeting_date?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          reminder?: string | null
          thread_id?: string | null
        }
        Update: {
          chat_history?: string | null
          created_at?: string
          email?: string | null
          id?: number
          meeting_date?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          reminder?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_employee_id: number | null
          auth_user_id: string | null
          client_type: string | null
          created_at: string
          id: string
          name: string
          service_start_date: string | null
          services_provided: string | null
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: number | null
          auth_user_id?: string | null
          client_type?: string | null
          created_at?: string
          id?: string
          name: string
          service_start_date?: string | null
          services_provided?: string | null
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: number | null
          auth_user_id?: string | null
          client_type?: string | null
          created_at?: string
          id?: string
          name?: string
          service_start_date?: string | null
          services_provided?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          chat_history: string | null
          chat_status: Database["public"]["Enums"]["chat_status"] | null
          client_id: string | null
          created_at: string
          description: string | null
          frequency: Database["public"]["Enums"]["task_frequency"] | null
          id: number
          is_template: boolean | null
          last_created_at: string | null
          next_scheduled_at: string | null
          parent_task_id: number | null
          scheduled_day: number | null
          status: string | null
          title: string | null
          user_id: number
        }
        Insert: {
          chat_history?: string | null
          chat_status?: Database["public"]["Enums"]["chat_status"] | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["task_frequency"] | null
          id?: number
          is_template?: boolean | null
          last_created_at?: string | null
          next_scheduled_at?: string | null
          parent_task_id?: number | null
          scheduled_day?: number | null
          status?: string | null
          title?: string | null
          user_id: number
        }
        Update: {
          chat_history?: string | null
          chat_status?: Database["public"]["Enums"]["chat_status"] | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["task_frequency"] | null
          id?: number
          is_template?: boolean | null
          last_created_at?: string | null
          next_scheduled_at?: string | null
          parent_task_id?: number | null
          scheduled_day?: number | null
          status?: string | null
          title?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
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
          auth_user_id: string | null
          category: string | null
          chat_history: string | null
          created_at: string
          id: number
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["role"] | null
        }
        Insert: {
          auth_user_id?: string | null
          category?: string | null
          chat_history?: string | null
          created_at?: string
          id?: number
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role"] | null
        }
        Update: {
          auth_user_id?: string | null
          category?: string | null
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
      is_client: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      chat_status: "open" | "closed"
      role: "employee" | "technician" | "manager" | "client"
      task_frequency:
        | "one_time"
        | "monthly"
        | "quarterly"
        | "semi_annually"
        | "annually"
        | "daily"
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
      role: ["employee", "technician", "manager", "client"],
      task_frequency: [
        "one_time",
        "monthly",
        "quarterly",
        "semi_annually",
        "annually",
        "daily",
      ],
    },
  },
} as const
