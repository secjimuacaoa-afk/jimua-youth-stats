
-- ============================================================
-- 1) CLASSES table
-- ============================================================
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  igreja_id UUID NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  guia TEXT,
  localizacao TEXT,
  coordenador TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (igreja_id, nome)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_by_jurisdiction" ON public.classes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_estruturas ue
      WHERE ue.user_id = auth.uid() AND ue.igreja_id = classes.igreja_id
    )
  );

CREATE POLICY "classes_write_local" ON public.classes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_estruturas ue
      WHERE ue.user_id = auth.uid() AND ue.igreja_id = classes.igreja_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_estruturas ue
      WHERE ue.user_id = auth.uid() AND ue.igreja_id = classes.igreja_id
    )
  );

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2) JOVENS: classe_id + bi_pendente_ate + BI unique
-- ============================================================
ALTER TABLE public.jovens
  ADD COLUMN IF NOT EXISTS classe_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bi_pendente_ate DATE DEFAULT '2026-12-31';

CREATE UNIQUE INDEX IF NOT EXISTS jovens_bi_numero_unique
  ON public.jovens (bi_numero) WHERE bi_numero IS NOT NULL;

-- Trigger: BI obrigatório em novos registos; bloquear updates fora do BI quando pendente expirou
CREATE OR REPLACE FUNCTION public.enforce_bi_obrigatorio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.bi_numero IS NULL OR length(trim(NEW.bi_numero)) = 0 THEN
      RAISE EXCEPTION 'O número do BI é obrigatório para novos cadastros.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.bi_numero IS NULL
       AND (NEW.bi_numero IS NULL OR length(trim(NEW.bi_numero)) = 0)
       AND COALESCE(OLD.bi_pendente_ate, '2026-12-31') < CURRENT_DATE THEN
      RAISE EXCEPTION 'Prazo para regularizar o BI expirou. Preencha o BI antes de qualquer outra alteração.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_bi_obrigatorio ON public.jovens;
CREATE TRIGGER trg_enforce_bi_obrigatorio
  BEFORE INSERT OR UPDATE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.enforce_bi_obrigatorio();

-- ============================================================
-- 3) ASSEMBLEIAS: campos extra + aprovação
-- ============================================================
ALTER TABLE public.assembleias
  ADD COLUMN IF NOT EXISTS igreja_id UUID REFERENCES public.igrejas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS jovens_base INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corpo_directivo INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS representantes_distrito INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS representantes_gabinete INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assistente INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aprovado_por UUID;

CREATE INDEX IF NOT EXISTS assembleias_igreja_periodo
  ON public.assembleias (igreja_id, ano, semestre) WHERE estado = 'aprovado';

-- ============================================================
-- 4) LOCK: quando assembleia da igreja/semestre está aprovada
-- ============================================================
CREATE OR REPLACE FUNCTION public.assembleia_bloqueia(
  _igreja_id UUID, _ano INT, _semestre INT
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assembleias
    WHERE igreja_id = _igreja_id
      AND ano = _ano AND semestre = _semestre
      AND estado = 'aprovado'
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_semester_lock_jovens()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.jovens;
BEGIN
  _row := COALESCE(NEW, OLD);
  IF _row.igreja_id IS NOT NULL
     AND public.assembleia_bloqueia(_row.igreja_id, _row.ano_semestre, _row.semestre)
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Semestre encerrado por assembleia aprovada. Alterações bloqueadas.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_lock_jovens ON public.jovens;
CREATE TRIGGER trg_lock_jovens
  BEFORE INSERT OR UPDATE OR DELETE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.enforce_semester_lock_jovens();

CREATE OR REPLACE FUNCTION public.enforce_semester_lock_ocorrencias()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.ocorrencias; _igreja UUID;
BEGIN
  _row := COALESCE(NEW, OLD);
  SELECT igreja_id INTO _igreja FROM public.jovens WHERE id = _row.jovem_id;
  IF _igreja IS NOT NULL
     AND public.assembleia_bloqueia(_igreja, _row.ano, _row.semestre)
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Semestre encerrado por assembleia aprovada.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_lock_ocorrencias ON public.ocorrencias;
CREATE TRIGGER trg_lock_ocorrencias
  BEFORE INSERT OR UPDATE OR DELETE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.enforce_semester_lock_ocorrencias();

CREATE OR REPLACE FUNCTION public.enforce_semester_lock_actividades()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.actividades;
BEGIN
  _row := COALESCE(NEW, OLD);
  IF _row.igreja_id IS NOT NULL
     AND public.assembleia_bloqueia(_row.igreja_id, _row.ano, _row.semestre)
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Semestre encerrado por assembleia aprovada.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_lock_actividades ON public.actividades;
CREATE TRIGGER trg_lock_actividades
  BEFORE INSERT OR UPDATE OR DELETE ON public.actividades
  FOR EACH ROW EXECUTE FUNCTION public.enforce_semester_lock_actividades();

-- ============================================================
-- 5) RPC: jovens a transferir para OJA (26+)
-- ============================================================
CREATE OR REPLACE FUNCTION public.jovens_a_transferir()
RETURNS TABLE (id UUID, nome TEXT, data_nascimento DATE, igreja_id UUID, idade INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT j.id, j.nome, j.data_nascimento, j.igreja_id,
    EXTRACT(YEAR FROM age(j.data_nascimento))::INT AS idade
  FROM public.jovens j
  WHERE j.is_oja = false
    AND j.activo = true
    AND EXTRACT(YEAR FROM age(j.data_nascimento))::INT >= 26
    AND (
      public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
      OR EXISTS (SELECT 1 FROM public.user_estruturas ue
                 WHERE ue.user_id = auth.uid() AND ue.igreja_id = j.igreja_id)
    );
$$;

GRANT EXECUTE ON FUNCTION public.jovens_a_transferir() TO authenticated;
