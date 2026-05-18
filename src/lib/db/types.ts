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
    PostgrestVersion: "14.5"
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
      accounts: {
        Row: {
          balance_cents: number
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bucket: {
        Row: {
          balance_cents: number
          caretaker_user_id: string
          created_at: string
          id: string
          kind: string
          piggybank_id: string
        }
        Insert: {
          balance_cents?: number
          caretaker_user_id: string
          created_at?: string
          id?: string
          kind: string
          piggybank_id: string
        }
        Update: {
          balance_cents?: number
          caretaker_user_id?: string
          created_at?: string
          id?: string
          kind?: string
          piggybank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: false
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_rule: {
        Row: {
          caretaker_user_id: string
          piggybank_id: string
          save_bps: number
          share_bps: number
          spend_bps: number
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          caretaker_user_id: string
          piggybank_id: string
          save_bps?: number
          share_bps?: number
          spend_bps?: number
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          caretaker_user_id?: string
          piggybank_id?: string
          save_bps?: number
          share_bps?: number
          spend_bps?: number
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_rule_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: true
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
        ]
      }
      funder: {
        Row: {
          archived_at: string | null
          caretaker_user_id: string
          created_at: string
          created_by_user_id: string | null
          display_name: string
          id: string
          piggybank_id: string
          relationship: string | null
          updated_at: string
          updated_by_user_id: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          caretaker_user_id: string
          created_at?: string
          created_by_user_id?: string | null
          display_name: string
          id?: string
          piggybank_id: string
          relationship?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          caretaker_user_id?: string
          created_at?: string
          created_by_user_id?: string | null
          display_name?: string
          id?: string
          piggybank_id?: string
          relationship?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: false
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_payouts: {
        Row: {
          account_id: string
          amount_cents: number
          apy_basis_points: number
          created_at: string
          id: string
          period_end: string
          period_start: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          apy_basis_points: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          apy_basis_points?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_payouts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_settings: {
        Row: {
          account_id: string
          apy_basis_points: number
          compounding_period: string
          last_paid_at: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          apy_basis_points?: number
          compounding_period?: string
          last_paid_at?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          apy_basis_points?: number
          compounding_period?: string
          last_paid_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_profile: {
        Row: {
          age: number
          avatar_emoji: string
          caretaker_user_id: string
          created_at: string
          created_by_user_id: string | null
          display_name: string
          features_json: Json
          id: string
          owner_auth_mode: string
          owner_pin_hash: string | null
          owner_user_id: string | null
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          age: number
          avatar_emoji?: string
          caretaker_user_id: string
          created_at?: string
          created_by_user_id?: string | null
          display_name: string
          features_json?: Json
          id?: string
          owner_auth_mode?: string
          owner_pin_hash?: string | null
          owner_user_id?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          age?: number
          avatar_emoji?: string
          caretaker_user_id?: string
          created_at?: string
          created_by_user_id?: string | null
          display_name?: string
          features_json?: Json
          id?: string
          owner_auth_mode?: string
          owner_pin_hash?: string | null
          owner_user_id?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: number
          title: string
        }
        Insert: {
          id?: never
          title: string
        }
        Update: {
          id?: never
          title?: string
        }
        Relationships: []
      }
      piggybank: {
        Row: {
          caretaker_user_id: string
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          kid_profile_id: string
          total_balance_cents: number
          updated_at: string
        }
        Insert: {
          caretaker_user_id: string
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          kid_profile_id: string
          total_balance_cents?: number
          updated_at?: string
        }
        Update: {
          caretaker_user_id?: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          kid_profile_id?: string
          total_balance_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "piggybank_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      request: {
        Row: {
          amount_cents: number
          caretaker_user_id: string
          created_at: string
          id: string
          intended_bucket_id: string | null
          intended_subcategory_id: string | null
          note: string | null
          piggybank_id: string
          resolved_transaction_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          submitted_by_user_id: string
        }
        Insert: {
          amount_cents: number
          caretaker_user_id: string
          created_at?: string
          id?: string
          intended_bucket_id?: string | null
          intended_subcategory_id?: string | null
          note?: string | null
          piggybank_id: string
          resolved_transaction_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status: string
          submitted_by_user_id: string
        }
        Update: {
          amount_cents?: number
          caretaker_user_id?: string
          created_at?: string
          id?: string
          intended_bucket_id?: string | null
          intended_subcategory_id?: string | null
          note?: string | null
          piggybank_id?: string
          resolved_transaction_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          submitted_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_intended_bucket_id_fkey"
            columns: ["intended_bucket_id"]
            isOneToOne: false
            referencedRelation: "bucket"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_intended_subcategory_id_fkey"
            columns: ["intended_subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: false
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_resolved_transaction_id_fkey"
            columns: ["resolved_transaction_id"]
            isOneToOne: false
            referencedRelation: "transaction"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategory: {
        Row: {
          apr_bps: number
          archived_at: string | null
          balance_cents: number
          bucket_id: string
          caretaker_user_id: string
          created_at: string
          created_by_user_id: string | null
          display_name: string
          emoji: string
          id: string
          piggybank_id: string
          target_amount_cents: number | null
          unsettled_interest_cents: number
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          apr_bps?: number
          archived_at?: string | null
          balance_cents?: number
          bucket_id: string
          caretaker_user_id: string
          created_at?: string
          created_by_user_id?: string | null
          display_name: string
          emoji?: string
          id?: string
          piggybank_id: string
          target_amount_cents?: number | null
          unsettled_interest_cents?: number
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          apr_bps?: number
          archived_at?: string | null
          balance_cents?: number
          bucket_id?: string
          caretaker_user_id?: string
          created_at?: string
          created_by_user_id?: string | null
          display_name?: string
          emoji?: string
          id?: string
          piggybank_id?: string
          target_amount_cents?: number | null
          unsettled_interest_cents?: number
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategory_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "bucket"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategory_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: false
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction: {
        Row: {
          amount_cents: number
          bucket_id: string | null
          caretaker_user_id: string
          created_at: string
          created_by_user_id: string | null
          funder_id: string | null
          id: string
          kind: string
          note: string | null
          occurred_at: string
          parent_id: string | null
          piggybank_id: string
          source_type: string | null
          subcategory_id: string | null
          voided_at: string | null
          voided_by_user_id: string | null
        }
        Insert: {
          amount_cents: number
          bucket_id?: string | null
          caretaker_user_id: string
          created_at?: string
          created_by_user_id?: string | null
          funder_id?: string | null
          id?: string
          kind: string
          note?: string | null
          occurred_at?: string
          parent_id?: string | null
          piggybank_id: string
          source_type?: string | null
          subcategory_id?: string | null
          voided_at?: string | null
          voided_by_user_id?: string | null
        }
        Update: {
          amount_cents?: number
          bucket_id?: string | null
          caretaker_user_id?: string
          created_at?: string
          created_by_user_id?: string | null
          funder_id?: string | null
          id?: string
          kind?: string
          note?: string | null
          occurred_at?: string
          parent_id?: string | null
          piggybank_id?: string
          source_type?: string | null
          subcategory_id?: string | null
          voided_at?: string | null
          voided_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "bucket"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "v_funder_stats"
            referencedColumns: ["funder_id"]
          },
          {
            foreignKeyName: "transaction_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "transaction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: false
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_funder_stats: {
        Row: {
          archived_at: string | null
          caretaker_user_id: string | null
          deposit_count: number | null
          display_name: string | null
          funder_id: string | null
          last_contribution_at: string | null
          piggybank_id: string | null
          relationship: string | null
          total_contributed_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: false
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
        ]
      }
      v_weekly_digest: {
        Row: {
          caretaker_user_id: string | null
          deposits_in_cents: number | null
          event_count: number | null
          net_change_cents: number | null
          piggybank_id: string | null
          spends_out_cents: number | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_piggybank_id_fkey"
            columns: ["piggybank_id"]
            isOneToOne: false
            referencedRelation: "piggybank"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_deposit: {
        Args: {
          p_amount_cents: number
          p_distribution?: Json
          p_funder_name: string
          p_funder_relationship?: string
          p_note?: string
          p_piggybank_id: string
          p_source_type?: string
        }
        Returns: string
      }
      create_piggybank_with_defaults: {
        Args: {
          p_age: number
          p_avatar_emoji?: string
          p_kid_name: string
          p_primary_funder_name?: string
          p_split_bps?: Json
        }
        Returns: string
      }
      find_or_create_funder: {
        Args: {
          p_display_name: string
          p_piggybank_id: string
          p_relationship?: string
        }
        Returns: string
      }
      signed_amount: {
        Args: { p_amount: number; p_kind: string }
        Returns: number
      }
      soft_delete_piggybank: {
        Args: { p_piggybank_id: string }
        Returns: undefined
      }
      void_transaction: {
        Args: { p_reason?: string; p_transaction_id: string }
        Returns: number
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
