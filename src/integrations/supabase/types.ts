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
  public: {
    Tables: {
      estruturas: {
        Row: {
          cargo_pastoral: string
          circuito: string
          created_at: string
          id: string
          intendencia: string
        }
        Insert: {
          cargo_pastoral: string
          circuito: string
          created_at?: string
          id?: string
          intendencia: string
        }
        Update: {
          cargo_pastoral?: string
          circuito?: string
          created_at?: string
          id?: string
          intendencia?: string
        }
        Relationships: []
      }
      jovens: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          created_by: string | null
          data_nascimento: string
          escolaridade: string | null
          estado_civil: string | null
          estrutura_id: string
          id: string
          motivo_inactividade: string | null
          nome: string
          ocupacao: string | null
          origem: string | null
          sexo: Database["public"]["Enums"]["sexo_tipo"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          created_at?: string
          created_by?: string | null
          data_nascimento: string
          escolaridade?: string | null
          estado_civil?: string | null
          estrutura_id: string
          id?: string
          motivo_inactividade?: string | null
          nome: string
          ocupacao?: string | null
          origem?: string | null
          sexo: Database["public"]["Enums"]["sexo_tipo"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          created_by?: string | null
          data_nascimento?: string
          escolaridade?: string | null
          estado_civil?: string | null
          estrutura_id?: string
          id?: string
          motivo_inactividade?: string | null
          nome?: string
          ocupacao?: string | null
          origem?: string | null
          sexo?: Database["public"]["Enums"]["sexo_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jovens_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nome_completo: string
          tipo: Database["public"]["Enums"]["user_tipo"]
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          nome_completo: string
          tipo?: Database["public"]["Enums"]["user_tipo"]
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nome_completo?: string
          tipo?: Database["public"]["Enums"]["user_tipo"]
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          ano: number
          comentario_admin: string | null
          created_at: string
          created_by: string | null
          data_submissao: string | null
          estrutura_id: string
          id: string
          semestre: number
          status: Database["public"]["Enums"]["relatorio_status"]
        }
        Insert: {
          ano: number
          comentario_admin?: string | null
          created_at?: string
          created_by?: string | null
          data_submissao?: string | null
          estrutura_id: string
          id?: string
          semestre: number
          status?: Database["public"]["Enums"]["relatorio_status"]
        }
        Update: {
          ano?: number
          comentario_admin?: string | null
          created_at?: string
          created_by?: string | null
          data_submissao?: string | null
          estrutura_id?: string
          id?: string
          semestre?: number
          status?: Database["public"]["Enums"]["relatorio_status"]
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_estruturas: {
        Row: {
          estrutura_id: string
          id: string
          user_id: string
        }
        Insert: {
          estrutura_id: string
          id?: string
          user_id: string
        }
        Update: {
          estrutura_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_estruturas_estrutura_id_fkey"
            columns: ["estrutura_id"]
            isOneToOne: false
            referencedRelation: "estruturas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "local"
      relatorio_status: "rascunho" | "submetido" | "aprovado" | "rejeitado"
      sexo_tipo: "masculino" | "feminino"
      user_tipo: "admin" | "local"
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
      app_role: ["admin", "local"],
      relatorio_status: ["rascunho", "submetido", "aprovado", "rejeitado"],
      sexo_tipo: ["masculino", "feminino"],
      user_tipo: ["admin", "local"],
    },
  },
} as const
