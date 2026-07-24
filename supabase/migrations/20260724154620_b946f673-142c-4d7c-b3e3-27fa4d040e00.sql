
-- =====================================================
-- Extensão da tabela jovens (novos campos opcionais)
-- =====================================================
ALTER TABLE public.jovens
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS bi_numero text,
  ADD COLUMN IF NOT EXISTS bi_data_emissao date,
  ADD COLUMN IF NOT EXISTS bi_validade date,
  ADD COLUMN IF NOT EXISTS nif text,
  ADD COLUMN IF NOT EXISTS nacionalidade text,
  ADD COLUMN IF NOT EXISTS naturalidade text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS municipio text,
  ADD COLUMN IF NOT EXISTS provincia text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS profissao text;

-- =====================================================
-- CONTACTOS (directório interno)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text NOT NULL,
  estrutura_tipo text NOT NULL CHECK (estrutura_tipo IN ('nacional','distrito','intendencia','circuito','igreja')),
  estrutura_id uuid,
  telefone text,
  whatsapp text,
  email text,
  foto_url text,
  notas text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contactos TO authenticated;
GRANT ALL ON public.contactos TO service_role;

ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contactos_select_all_auth" ON public.contactos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "contactos_insert_self" ON public.contactos
  FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());
CREATE POLICY "contactos_update_owner_or_admin" ON public.contactos
  FOR UPDATE TO authenticated USING (
    criado_por = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "contactos_delete_owner_or_admin" ON public.contactos
  FOR DELETE TO authenticated USING (
    criado_por = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER update_contactos_updated_at BEFORE UPDATE ON public.contactos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- OCORRÊNCIAS (entradas / saídas de jovens)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jovem_id uuid NOT NULL REFERENCES public.jovens(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  semestre integer NOT NULL CHECK (semestre IN (1,2)),
  data date NOT NULL DEFAULT CURRENT_DATE,
  tipo_categoria text NOT NULL CHECK (tipo_categoria IN ('entrada','saida')),
  tipo_codigo text NOT NULL,
  motivo text,
  observacoes text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_jovem ON public.ocorrencias(jovem_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_periodo ON public.ocorrencias(ano, semestre);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ocorrencias TO authenticated;
GRANT ALL ON public.ocorrencias TO service_role;

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ocorrencias_select_by_jurisdiction" ON public.ocorrencias
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE j.id = ocorrencias.jovem_id AND ue.user_id = auth.uid()
    )
  );
CREATE POLICY "ocorrencias_write_by_jurisdiction" ON public.ocorrencias
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE j.id = ocorrencias.jovem_id AND ue.user_id = auth.uid()
    )
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE j.id = ocorrencias.jovem_id AND ue.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: aplica estado ao jovem quando é uma saída
CREATE OR REPLACE FUNCTION public.ocorrencia_apply_estado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE motivo_map text;
BEGIN
  IF NEW.tipo_categoria = 'saida' THEN
    motivo_map := CASE NEW.tipo_codigo
      WHEN 'ausente_estudo' THEN 'E'
      WHEN 'ausente_saude' THEN 'F'
      WHEN 'ausente_trabalho' THEN 'E'
      WHEN 'transferido' THEN 'G'
      WHEN 'desistente' THEN 'C'
      WHEN 'falecido' THEN 'D'
      ELSE 'G1'
    END;
    UPDATE public.jovens
      SET activo = false, motivo_inactividade = motivo_map
      WHERE id = NEW.jovem_id;
  ELSIF NEW.tipo_categoria = 'entrada' THEN
    UPDATE public.jovens
      SET activo = true, motivo_inactividade = NULL
      WHERE id = NEW.jovem_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ocorrencia_apply_estado AFTER INSERT ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.ocorrencia_apply_estado();

-- =====================================================
-- ACTIVIDADES + PRESENÇAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id uuid NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  semestre integer NOT NULL CHECK (semestre IN (1,2)),
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  data date NOT NULL,
  tipo text NOT NULL,
  local text,
  descricao text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actividades_igreja_periodo ON public.actividades(igreja_id, ano, semestre);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.actividades TO authenticated;
GRANT ALL ON public.actividades TO service_role;

ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actividades_all_by_jurisdiction" ON public.actividades
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (SELECT 1 FROM public.user_estruturas ue WHERE ue.user_id = auth.uid() AND ue.igreja_id = actividades.igreja_id)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (SELECT 1 FROM public.user_estruturas ue WHERE ue.user_id = auth.uid() AND ue.igreja_id = actividades.igreja_id)
  );

CREATE TRIGGER update_actividades_updated_at BEFORE UPDATE ON public.actividades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actividade_id uuid NOT NULL REFERENCES public.actividades(id) ON DELETE CASCADE,
  jovem_id uuid NOT NULL REFERENCES public.jovens(id) ON DELETE CASCADE,
  estado text NOT NULL CHECK (estado IN ('presente','ausente','justificado')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actividade_id, jovem_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.presencas TO authenticated;
GRANT ALL ON public.presencas TO service_role;

ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presencas_all_by_jurisdiction" ON public.presencas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.actividades a
      JOIN public.user_estruturas ue ON ue.igreja_id = a.igreja_id
      WHERE a.id = presencas.actividade_id AND ue.user_id = auth.uid()
    )
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.actividades a
      JOIN public.user_estruturas ue ON ue.igreja_id = a.igreja_id
      WHERE a.id = presencas.actividade_id AND ue.user_id = auth.uid()
    )
  );

-- =====================================================
-- ASSEMBLEIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assembleias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  semestre integer NOT NULL CHECK (semestre IN (1,2)),
  data date NOT NULL,
  estrutura_tipo text NOT NULL CHECK (estrutura_tipo IN ('nacional','distrito')),
  estrutura_id uuid,
  estado text NOT NULL DEFAULT 'preparacao' CHECK (estado IN ('preparacao','revisao','aprovada','encerrada')),
  observacoes text,
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assembleias TO authenticated;
GRANT ALL ON public.assembleias TO service_role;

ALTER TABLE public.assembleias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assembleias_select_auth" ON public.assembleias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "assembleias_write_admin" ON public.assembleias
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER update_assembleias_updated_at BEFORE UPDATE ON public.assembleias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
