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
      actividades: {
        Row: {
          ano: number
          created_at: string
          criado_por: string | null
          data: string
          descricao: string | null
          id: string
          igreja_id: string
          local: string | null
          mes: number
          semestre: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          criado_por?: string | null
          data: string
          descricao?: string | null
          id?: string
          igreja_id: string
          local?: string | null
          mes: number
          semestre: number
          tipo: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          criado_por?: string | null
          data?: string
          descricao?: string | null
          id?: string
          igreja_id?: string
          local?: string | null
          mes?: number
          semestre?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      assembleias: {
        Row: {
          ano: number
          created_at: string
          data: string
          estado: string
          estrutura_id: string | null
          estrutura_tipo: string
          id: string
          observacoes: string | null
          responsavel_id: string | null
          semestre: number
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          data: string
          estado?: string
          estrutura_id?: string | null
          estrutura_tipo: string
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          semestre: number
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          data?: string
          estado?: string
          estrutura_id?: string | null
          estrutura_tipo?: string
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          semestre?: number
          updated_at?: string
        }
        Relationships: []
      }
      circuitos: {
        Row: {
          created_at: string
          id: string
          intendencia_id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          intendencia_id: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          intendencia_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuitos_intendencia_id_fkey"
            columns: ["intendencia_id"]
            isOneToOne: false
            referencedRelation: "intendencias"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos: {
        Row: {
          cargo: string
          created_at: string
          criado_por: string | null
          email: string | null
          estrutura_id: string | null
          estrutura_tipo: string
          foto_url: string | null
          id: string
          nome: string
          notas: string | null
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cargo: string
          created_at?: string
          criado_por?: string | null
          email?: string | null
          estrutura_id?: string | null
          estrutura_tipo: string
          foto_url?: string | null
          id?: string
          nome: string
          notas?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cargo?: string
          created_at?: string
          criado_por?: string | null
          email?: string | null
          estrutura_id?: string | null
          estrutura_tipo?: string
          foto_url?: string | null
          id?: string
          nome?: string
          notas?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      distritos: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      igrejas: {
        Row: {
          circuito_id: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          circuito_id: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          circuito_id?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "igrejas_circuito_id_fkey"
            columns: ["circuito_id"]
            isOneToOne: false
            referencedRelation: "circuitos"
            referencedColumns: ["id"]
          },
        ]
      }
      intendencias: {
        Row: {
          created_at: string
          distrito_id: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          distrito_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          distrito_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "intendencias_distrito_id_fkey"
            columns: ["distrito_id"]
            isOneToOne: false
            referencedRelation: "distritos"
            referencedColumns: ["id"]
          },
        ]
      }
      jovens: {
        Row: {
          activo: boolean
          ano_semestre: number
          bairro: string | null
          bi_data_emissao: string | null
          bi_numero: string | null
          bi_validade: string | null
          categoria: string
          created_at: string
          created_by: string | null
          data_nascimento: string
          documentacao: string[] | null
          documento_url: string | null
          email: string | null
          endereco: string | null
          escolaridade: string | null
          estado_civil: string | null
          foto_url: string | null
          id: string
          igreja_id: string | null
          is_oja: boolean
          motivo_inactividade: string | null
          municipio: string | null
          nacionalidade: string | null
          naturalidade: string | null
          nif: string | null
          nome: string
          ocupacao: string | null
          origem: string | null
          profissao: string | null
          provincia: string | null
          semestre: number
          sexo: Database["public"]["Enums"]["sexo_tipo"]
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean
          ano_semestre?: number
          bairro?: string | null
          bi_data_emissao?: string | null
          bi_numero?: string | null
          bi_validade?: string | null
          categoria: string
          created_at?: string
          created_by?: string | null
          data_nascimento: string
          documentacao?: string[] | null
          documento_url?: string | null
          email?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          foto_url?: string | null
          id?: string
          igreja_id?: string | null
          is_oja?: boolean
          motivo_inactividade?: string | null
          municipio?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nif?: string | null
          nome: string
          ocupacao?: string | null
          origem?: string | null
          profissao?: string | null
          provincia?: string | null
          semestre?: number
          sexo: Database["public"]["Enums"]["sexo_tipo"]
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean
          ano_semestre?: number
          bairro?: string | null
          bi_data_emissao?: string | null
          bi_numero?: string | null
          bi_validade?: string | null
          categoria?: string
          created_at?: string
          created_by?: string | null
          data_nascimento?: string
          documentacao?: string[] | null
          documento_url?: string | null
          email?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          foto_url?: string | null
          id?: string
          igreja_id?: string | null
          is_oja?: boolean
          motivo_inactividade?: string | null
          municipio?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nif?: string | null
          nome?: string
          ocupacao?: string | null
          origem?: string | null
          profissao?: string | null
          provincia?: string | null
          semestre?: number
          sexo?: Database["public"]["Enums"]["sexo_tipo"]
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jovens_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      jovens_audit: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          campo: string
          id: string
          jovem_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          campo: string
          id?: string
          jovem_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          campo?: string
          id?: string
          jovem_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      ocorrencias: {
        Row: {
          ano: number
          created_at: string
          criado_por: string | null
          data: string
          id: string
          jovem_id: string
          motivo: string | null
          observacoes: string | null
          semestre: number
          tipo_categoria: string
          tipo_codigo: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          criado_por?: string | null
          data?: string
          id?: string
          jovem_id: string
          motivo?: string | null
          observacoes?: string | null
          semestre: number
          tipo_categoria: string
          tipo_codigo: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          criado_por?: string | null
          data?: string
          id?: string
          jovem_id?: string
          motivo?: string | null
          observacoes?: string | null
          semestre?: number
          tipo_categoria?: string
          tipo_codigo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_jovem_id_fkey"
            columns: ["jovem_id"]
            isOneToOne: false
            referencedRelation: "jovens"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          actividade_id: string
          created_at: string
          estado: string
          id: string
          jovem_id: string
          observacoes: string | null
        }
        Insert: {
          actividade_id: string
          created_at?: string
          estado: string
          id?: string
          jovem_id: string
          observacoes?: string | null
        }
        Update: {
          actividade_id?: string
          created_at?: string
          estado?: string
          id?: string
          jovem_id?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presencas_actividade_id_fkey"
            columns: ["actividade_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_jovem_id_fkey"
            columns: ["jovem_id"]
            isOneToOne: false
            referencedRelation: "jovens"
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
          id: string
          igreja_id: string | null
          semestre: number
          status: Database["public"]["Enums"]["relatorio_status"]
        }
        Insert: {
          ano: number
          comentario_admin?: string | null
          created_at?: string
          created_by?: string | null
          data_submissao?: string | null
          id?: string
          igreja_id?: string | null
          semestre: number
          status?: Database["public"]["Enums"]["relatorio_status"]
        }
        Update: {
          ano?: number
          comentario_admin?: string | null
          created_at?: string
          created_by?: string | null
          data_submissao?: string | null
          id?: string
          igreja_id?: string | null
          semestre?: number
          status?: Database["public"]["Enums"]["relatorio_status"]
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_estruturas: {
        Row: {
          distrito_id: string | null
          id: string
          igreja_id: string | null
          user_id: string
        }
        Insert: {
          distrito_id?: string | null
          id?: string
          igreja_id?: string | null
          user_id: string
        }
        Update: {
          distrito_id?: string | null
          id?: string
          igreja_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_estruturas_distrito_id_fkey"
            columns: ["distrito_id"]
            isOneToOne: false
            referencedRelation: "distritos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_estruturas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
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
      public_dashboard_stats: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "local" | "super_admin"
      relatorio_status: "rascunho" | "submetido" | "aprovado" | "rejeitado"
      sexo_tipo: "masculino" | "feminino"
      user_tipo: "admin" | "local" | "super_admin"
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
      app_role: ["admin", "local", "super_admin"],
      relatorio_status: ["rascunho", "submetido", "aprovado", "rejeitado"],
      sexo_tipo: ["masculino", "feminino"],
      user_tipo: ["admin", "local", "super_admin"],
    },
  },
} as const
