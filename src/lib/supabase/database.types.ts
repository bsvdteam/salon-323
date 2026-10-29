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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          credit_applied_chf: number
          cut: string | null
          duration_min: number
          google_event_id: string | null
          id: string
          member_id: string
          note: string | null
          pay_method: string
          price_chf: number
          services: string[]
          starts_at: string
          status: string
        }
        Insert: {
          created_at?: string
          credit_applied_chf?: number
          cut?: string | null
          duration_min?: number
          google_event_id?: string | null
          id?: string
          member_id: string
          note?: string | null
          pay_method?: string
          price_chf?: number
          services: string[]
          starts_at: string
          status?: string
        }
        Update: {
          created_at?: string
          credit_applied_chf?: number
          cut?: string | null
          duration_min?: number
          google_event_id?: string | null
          id?: string
          member_id?: string
          note?: string | null
          pay_method?: string
          price_chf?: number
          services?: string[]
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_absences: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string
          source: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string
          source?: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          source?: string
          start_date?: string
        }
        Relationships: []
      }
      barber_date_overrides: {
        Row: {
          close_min: number
          is_open: boolean
          open_min: number
          override_date: string
        }
        Insert: {
          close_min?: number
          is_open?: boolean
          open_min?: number
          override_date: string
        }
        Update: {
          close_min?: number
          is_open?: boolean
          open_min?: number
          override_date?: string
        }
        Relationships: []
      }
      barber_hours: {
        Row: {
          close_min: number
          is_open: boolean
          open_min: number
          weekday: number
        }
        Insert: {
          close_min?: number
          is_open?: boolean
          open_min?: number
          weekday: number
        }
        Update: {
          close_min?: number
          is_open?: boolean
          open_min?: number
          weekday?: number
        }
        Relationships: []
      }
      barber_settings: {
        Row: {
          buffer_min: number
          calendly_connected: boolean
          cancel_hours: number
          id: boolean
          lead_hours: number
          pause_end_min: number
          pause_start_min: number
          price_chf: number
        }
        Insert: {
          buffer_min?: number
          calendly_connected?: boolean
          cancel_hours?: number
          id?: boolean
          lead_hours?: number
          pause_end_min?: number
          pause_start_min?: number
          price_chf?: number
        }
        Update: {
          buffer_min?: number
          calendly_connected?: boolean
          cancel_hours?: number
          id?: boolean
          lead_hours?: number
          pause_end_min?: number
          pause_start_min?: number
          price_chf?: number
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          first_name: string
          id: string
          inviter_id: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          first_name: string
          id?: string
          inviter_id?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          first_name?: string
          id?: string
          inviter_id?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          card_index: number
          contact_email: string | null
          created_at: string
          cut: string
          cuts: number
          first_name: string
          id: string
          invited_by: string | null
          is_barber: boolean
          last_name: string
          login_failed: number
          login_locked_until: string | null
          member_no: string
          member_since: string
          note: string | null
          password_hash: string | null
          phone: string
          pin_hash: string | null
          ref_code: string
          template: string[]
          username: string
        }
        Insert: {
          card_index?: number
          contact_email?: string | null
          created_at?: string
          cut?: string
          cuts?: number
          first_name: string
          id?: string
          invited_by?: string | null
          is_barber?: boolean
          last_name?: string
          login_failed?: number
          login_locked_until?: string | null
          member_no: string
          member_since?: string
          note?: string | null
          password_hash?: string | null
          phone?: string
          pin_hash?: string | null
          ref_code: string
          template?: string[]
          username: string
        }
        Update: {
          card_index?: number
          contact_email?: string | null
          created_at?: string
          cut?: string
          cuts?: number
          first_name?: string
          id?: string
          invited_by?: string | null
          is_barber?: boolean
          last_name?: string
          login_failed?: number
          login_locked_until?: string | null
          member_no?: string
          member_since?: string
          note?: string | null
          password_hash?: string | null
          phone?: string
          pin_hash?: string | null
          ref_code?: string
          template?: string[]
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite: {
        Args: { p_first_name: string; p_inviter: string }
        Returns: {
          code: string
          created_at: string
          expires_at: string
          first_name: string
          id: string
          inviter_id: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_appointment_done: { Args: { p_id: string }; Returns: boolean }
      new_ref_code: { Args: never; Returns: string }
      redeem_code_create_member: {
        Args: {
          p_card: number
          p_code: string
          p_first: string
          p_last: string
          p_phone: string
          p_username: string
        }
        Returns: {
          card_index: number
          contact_email: string | null
          created_at: string
          cut: string
          cuts: number
          first_name: string
          id: string
          invited_by: string | null
          is_barber: boolean
          last_name: string
          login_failed: number
          login_locked_until: string | null
          member_no: string
          member_since: string
          note: string | null
          password_hash: string | null
          phone: string
          pin_hash: string | null
          ref_code: string
          template: string[]
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_invite_create_member: {
        Args: {
          p_card: number
          p_code: string
          p_last: string
          p_phone: string
          p_username: string
        }
        Returns: {
          card_index: number
          contact_email: string | null
          created_at: string
          cut: string
          cuts: number
          first_name: string
          id: string
          invited_by: string | null
          is_barber: boolean
          last_name: string
          login_failed: number
          login_locked_until: string | null
          member_no: string
          member_since: string
          note: string | null
          password_hash: string | null
          phone: string
          pin_hash: string | null
          ref_code: string
          template: string[]
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_login_failure: { Args: { p_id: string }; Returns: boolean }
      settle_past_appointments: { Args: never; Returns: number }
      validate_code: {
        Args: { p_code: string }
        Returns: {
          first_name: string
          inviter_name: string
          kind: string
        }[]
      }
      validate_invite: {
        Args: { p_code: string }
        Returns: {
          first_name: string
          inviter_name: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
