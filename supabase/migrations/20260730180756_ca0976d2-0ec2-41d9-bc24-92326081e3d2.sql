-- 1. Novos campos em jovens
ALTER TABLE public.jovens
  ADD COLUMN IF NOT EXISTS sem_bi boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS area_formacao text;

-- 2. Migração de códigos para o modelo oficial
UPDATE public.jovens SET categoria = CASE categoria WHEN 'J' THEN 'I' WHEN 'K' THEN 'J' WHEN 'L' THEN 'K' ELSE categoria END
  WHERE categoria IN ('J','K','L');
UPDATE public.jovens SET escolaridade = CASE escolaridade WHEN 'M' THEN 'L' WHEN 'N' THEN 'L1' WHEN 'O' THEN 'L2' WHEN 'P' THEN 'M' WHEN 'P1' THEN 'M1' WHEN 'P2' THEN 'M2' WHEN 'Q' THEN 'N' ELSE escolaridade END
  WHERE escolaridade IN ('M','N','O','P','P1','P2','Q');
UPDATE public.jovens SET ocupacao = CASE ocupacao WHEN 'R' THEN 'T' WHEN 'S' THEN 'U' WHEN 'T' THEN 'U1' WHEN 'U' THEN 'U2' WHEN 'W' THEN 'U3' WHEN 'V' THEN 'V' WHEN 'X' THEN 'W' WHEN 'X1' THEN 'W1' ELSE ocupacao END
  WHERE ocupacao IN ('R','S','T','U','V','W','X','X1');
UPDATE public.jovens SET estado_civil = CASE estado_civil WHEN 'Y' THEN 'X' WHEN 'Z' THEN 'Z' ELSE estado_civil END
  WHERE estado_civil IN ('Y','Z');
UPDATE public.jovens SET origem = CASE origem WHEN 'B' THEN 'A3' WHEN 'B1' THEN 'A3' ELSE origem END
  WHERE origem IN ('B','B1');
UPDATE public.jovens SET motivo_inactividade = CASE motivo_inactividade WHEN 'C' THEN 'B2' WHEN 'D' THEN 'B3' WHEN 'E' THEN 'C' WHEN 'F' THEN 'D' WHEN 'G' THEN 'F' WHEN 'G1' THEN 'E' ELSE motivo_inactividade END
  WHERE motivo_inactividade IN ('C','D','E','F','G','G1');

-- 3. Helper: distrito de uma igreja
CREATE OR REPLACE FUNCTION public.igreja_distrito(_igreja_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i2.distrito_id
  FROM public.igrejas ig
  JOIN public.circuitos c ON c.id = ig.circuito_id
  JOIN public.intendencias i2 ON i2.id = c.intendencia_id
  WHERE ig.id = _igreja_id;
$$;
REVOKE EXECUTE ON FUNCTION public.igreja_distrito(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.igreja_distrito(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.igreja_na_minha_jurisdicao(_igreja_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'super_admin')
      OR EXISTS (SELECT 1 FROM public.user_estruturas ue WHERE ue.user_id = auth.uid() AND ue.igreja_id = _igreja_id)
      OR EXISTS (SELECT 1 FROM public.user_estruturas ue WHERE ue.user_id = auth.uid()
                   AND ue.distrito_id IS NOT NULL AND ue.distrito_id = public.igreja_distrito(_igreja_id));
$$;
REVOKE EXECUTE ON FUNCTION public.igreja_na_minha_jurisdicao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.igreja_na_minha_jurisdicao(uuid) TO authenticated;

-- 4. Períodos estatísticos (semestres)
CREATE TABLE IF NOT EXISTS public.periodos_estatisticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id uuid NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  semestre integer NOT NULL CHECK (semestre IN (1,2)),
  estado text NOT NULL DEFAULT 'aberto' CHECK (estado IN ('aberto','fechado')),
  numero_anterior_real integer NOT NULL DEFAULT 0,
  numero_anterior_fisico integer NOT NULL DEFAULT 0,
  numero_actual_real integer,
  numero_actual_fisico integer,
  entradas integer,
  saidas integer,
  snapshot jsonb,
  fechado_em timestamptz,
  fechado_por uuid,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (igreja_id, ano, semestre)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.periodos_estatisticos TO authenticated;
GRANT ALL ON public.periodos_estatisticos TO service_role;
ALTER TABLE public.periodos_estatisticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY periodos_select ON public.periodos_estatisticos FOR SELECT TO authenticated
  USING (public.igreja_na_minha_jurisdicao(igreja_id));
CREATE POLICY periodos_write ON public.periodos_estatisticos FOR ALL TO authenticated
  USING (public.igreja_na_minha_jurisdicao(igreja_id))
  WITH CHECK (public.igreja_na_minha_jurisdicao(igreja_id));
CREATE TRIGGER periodos_updated_at BEFORE UPDATE ON public.periodos_estatisticos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Pedidos de autorização de edição
CREATE TABLE IF NOT EXISTS public.pedidos_desbloqueio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id uuid NOT NULL REFERENCES public.igrejas(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  semestre integer NOT NULL CHECK (semestre IN (1,2)),
  justificacao text NOT NULL,
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','autorizado','recusado')),
  autorizado_ate timestamptz,
  resposta text,
  solicitado_por uuid,
  decidido_por uuid,
  decidido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_desbloqueio TO authenticated;
GRANT ALL ON public.pedidos_desbloqueio TO service_role;
ALTER TABLE public.pedidos_desbloqueio ENABLE ROW LEVEL SECURITY;
CREATE POLICY pedidos_select ON public.pedidos_desbloqueio FOR SELECT TO authenticated
  USING (public.igreja_na_minha_jurisdicao(igreja_id));
CREATE POLICY pedidos_insert_local ON public.pedidos_desbloqueio FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_estruturas ue WHERE ue.user_id = auth.uid() AND ue.igreja_id = pedidos_desbloqueio.igreja_id));
CREATE POLICY pedidos_update_admin ON public.pedidos_desbloqueio FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER pedidos_updated_at BEFORE UPDATE ON public.pedidos_desbloqueio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Aprovação única por igreja/semestre
CREATE UNIQUE INDEX IF NOT EXISTS assembleias_aprovada_unica
  ON public.assembleias (igreja_id, ano, semestre) WHERE estado = 'aprovado';

-- 7. Bloqueio de semestre com autorização temporária
CREATE OR REPLACE FUNCTION public.semestre_bloqueado(_igreja_id uuid, _ano integer, _semestre integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    EXISTS (SELECT 1 FROM public.assembleias a
             WHERE a.igreja_id = _igreja_id AND a.ano = _ano AND a.semestre = _semestre AND a.estado = 'aprovado')
    OR EXISTS (SELECT 1 FROM public.periodos_estatisticos p
             WHERE p.igreja_id = _igreja_id AND p.ano = _ano AND p.semestre = _semestre AND p.estado = 'fechado')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.pedidos_desbloqueio pd
     WHERE pd.igreja_id = _igreja_id AND pd.ano = _ano AND pd.semestre = _semestre
       AND pd.estado = 'autorizado' AND (pd.autorizado_ate IS NULL OR pd.autorizado_ate > now())
  );
$$;
REVOKE EXECUTE ON FUNCTION public.semestre_bloqueado(uuid,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.semestre_bloqueado(uuid,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_semester_lock_jovens()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.jovens;
BEGIN
  _row := COALESCE(NEW, OLD);
  IF _row.igreja_id IS NOT NULL
     AND public.semestre_bloqueado(_row.igreja_id, _row.ano_semestre, _row.semestre)
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Semestre encerrado. Solicite autorização ao Secretário Distrital para editar.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_semester_lock_ocorrencias()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.ocorrencias; _igreja uuid;
BEGIN
  _row := COALESCE(NEW, OLD);
  SELECT igreja_id INTO _igreja FROM public.jovens WHERE id = _row.jovem_id;
  IF _igreja IS NOT NULL
     AND public.semestre_bloqueado(_igreja, _row.ano, _row.semestre)
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Semestre encerrado. Solicite autorização ao Secretário Distrital para editar.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_semester_lock_actividades()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.actividades;
BEGIN
  _row := COALESCE(NEW, OLD);
  IF _row.igreja_id IS NOT NULL
     AND public.semestre_bloqueado(_row.igreja_id, _row.ano, _row.semestre)
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Semestre encerrado. Solicite autorização ao Secretário Distrital para editar.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

-- 8. BI obrigatório salvo quando marcado "sem BI"
CREATE OR REPLACE FUNCTION public.enforce_bi_obrigatorio()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sem_bi THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.bi_numero IS NULL OR length(trim(NEW.bi_numero)) = 0 THEN
      RAISE EXCEPTION 'Indique o número do BI ou marque "Não possui documento de identificação (BI)".';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.bi_numero IS NULL
       AND (NEW.bi_numero IS NULL OR length(trim(NEW.bi_numero)) = 0)
       AND COALESCE(OLD.bi_pendente_ate, '2026-12-31') < CURRENT_DATE THEN
      RAISE EXCEPTION 'Prazo para regularizar o BI expirou. Preencha o BI ou marque "Não possui BI".';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- 9. Ano/semestre automáticos a partir da data
CREATE OR REPLACE FUNCTION public.set_periodo_ocorrencia()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.ano := EXTRACT(YEAR FROM NEW.data)::int;
  NEW.semestre := CASE WHEN EXTRACT(MONTH FROM NEW.data)::int <= 6 THEN 1 ELSE 2 END;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.set_periodo_ocorrencia() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_set_periodo_ocorrencia ON public.ocorrencias;
CREATE TRIGGER trg_set_periodo_ocorrencia BEFORE INSERT OR UPDATE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.set_periodo_ocorrencia();

CREATE OR REPLACE FUNCTION public.set_periodo_jovem()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.ano_semestre := EXTRACT(YEAR FROM CURRENT_DATE)::int;
    NEW.semestre := CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE)::int <= 6 THEN 1 ELSE 2 END;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.set_periodo_jovem() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_set_periodo_jovem ON public.jovens;
CREATE TRIGGER trg_set_periodo_jovem BEFORE INSERT ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.set_periodo_jovem();

-- 10. Estado do jovem por ocorrência, com os novos códigos
CREATE OR REPLACE FUNCTION public.ocorrencia_apply_estado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE motivo_map text;
BEGIN
  IF NEW.tipo_categoria = 'saida' THEN
    motivo_map := CASE NEW.tipo_codigo
      WHEN 'ausente_estudo' THEN 'C'
      WHEN 'ausente_trabalho' THEN 'C'
      WHEN 'ausente_saude' THEN 'D'
      WHEN 'ausente_diversas' THEN 'E'
      WHEN 'disciplinar' THEN 'F'
      WHEN 'encaminhado_oja' THEN 'B'
      WHEN 'transferido' THEN 'B1'
      WHEN 'desistente' THEN 'B2'
      WHEN 'falecido' THEN 'B3'
      ELSE 'E'
    END;
    UPDATE public.jovens
      SET activo = false, motivo_inactividade = motivo_map
      WHERE id = NEW.jovem_id;
    IF NEW.tipo_codigo = 'encaminhado_oja' THEN
      UPDATE public.jovens SET is_oja = true WHERE id = NEW.jovem_id;
    END IF;
  ELSIF NEW.tipo_categoria = 'entrada' THEN
    UPDATE public.jovens
      SET activo = true, motivo_inactividade = NULL
      WHERE id = NEW.jovem_id;
  END IF;
  RETURN NEW;
END; $$;

-- 11. Gatilhos garantidos
DROP TRIGGER IF EXISTS trg_ocorrencia_apply_estado ON public.ocorrencias;
CREATE TRIGGER trg_ocorrencia_apply_estado AFTER INSERT ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.ocorrencia_apply_estado();
DROP TRIGGER IF EXISTS trg_lock_ocorrencias ON public.ocorrencias;
CREATE TRIGGER trg_lock_ocorrencias BEFORE INSERT OR UPDATE OR DELETE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.enforce_semester_lock_ocorrencias();
DROP TRIGGER IF EXISTS trg_lock_jovens ON public.jovens;
CREATE TRIGGER trg_lock_jovens BEFORE UPDATE OR DELETE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.enforce_semester_lock_jovens();
DROP TRIGGER IF EXISTS trg_bi_obrigatorio ON public.jovens;
CREATE TRIGGER trg_bi_obrigatorio BEFORE INSERT OR UPDATE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.enforce_bi_obrigatorio();
DROP TRIGGER IF EXISTS trg_audit_jovens ON public.jovens;
CREATE TRIGGER trg_audit_jovens AFTER UPDATE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.audit_jovens_changes();
DROP TRIGGER IF EXISTS trg_jovens_updated_at ON public.jovens;
CREATE TRIGGER trg_jovens_updated_at BEFORE UPDATE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();