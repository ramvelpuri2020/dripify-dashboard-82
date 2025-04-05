export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          budget_range: string | null
          color_preferences: string[] | null
          created_at: string
          favorite_brands: string[] | null
          id: string
          size_info: Json | null
          style_preferences: string[] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          budget_range?: string | null
          color_preferences?: string[] | null
          created_at?: string
          favorite_brands?: string[] | null
          id: string
          size_info?: Json | null
          style_preferences?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          budget_range?: string | null
          color_preferences?: string[] | null
          created_at?: string
          favorite_brands?: string[] | null
          id?: string
          size_info?: Json | null
          style_preferences?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      saved_outfits: {
        Row: {
          created_at: string
          id: string
          image_url: string
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_analyses: {
        Row: {
          breakdown: Json
          created_at: string
          feedback: string
          id: string
          image_url: string
          last_scan_date: string | null
          raw_analysis: string | null
          scan_date: string | null
          streak_count: number | null
          thumbnail_url: string | null
          tips: Json | null
          total_score: number
          user_id: string | null
        }
        Insert: {
          breakdown: Json
          created_at?: string
          feedback: string
          id?: string
          image_url: string
          last_scan_date?: string | null
          raw_analysis?: string | null
          scan_date?: string | null
          streak_count?: number | null
          thumbnail_url?: string | null
          tips?: Json | null
          total_score: number
          user_id?: string | null
        }
        Update: {
          breakdown?: Json
          created_at?: string
          feedback?: string
          id?: string
          image_url?: string
          last_scan_date?: string | null
          raw_analysis?: string | null
          scan_date?: string | null
          streak_count?: number | null
          thumbnail_url?: string | null
          tips?: Json | null
          total_score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
