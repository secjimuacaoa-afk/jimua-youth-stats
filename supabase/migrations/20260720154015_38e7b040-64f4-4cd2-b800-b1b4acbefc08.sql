
-- 1. Remove anon SELECT policies on org structure and jovens
DROP POLICY IF EXISTS "Public view igrejas" ON public.igrejas;
DROP POLICY IF EXISTS "Public view circuitos" ON public.circuitos;
DROP POLICY IF EXISTS "Public view intendencias" ON public.intendencias;
DROP POLICY IF EXISTS "Public can view distritos" ON public.distritos;
DROP POLICY IF EXISTS "Public view jovens stats" ON public.jovens;

-- 2. Remove always-true audit insert policy (trigger is SECURITY DEFINER so writes still succeed)
DROP POLICY IF EXISTS "System can insert audit" ON public.jovens_audit;

-- 3. Aggregated public stats function (anon-safe, no row-level exposure)
CREATE OR REPLACE FUNCTION public.public_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  WITH j AS (
    SELECT sexo, activo, data_nascimento, categoria, escolaridade, ocupacao,
           estado_civil, origem, motivo_inactividade, is_oja, igreja_id
    FROM public.jovens WHERE is_oja = false
  ),
  active AS (SELECT * FROM j WHERE activo = true),
  by_church AS (
    SELECT i.nome AS name, count(*)::int AS value
    FROM active a JOIN public.igrejas i ON i.id = a.igreja_id
    GROUP BY i.nome ORDER BY value DESC LIMIT 10
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM active),
    'inactivos', (SELECT count(*) FROM j WHERE activo = false),
    'masculino', (SELECT count(*) FROM active WHERE sexo = 'masculino'),
    'feminino', (SELECT count(*) FROM active WHERE sexo = 'feminino'),
    'faixa_12_17', (SELECT count(*) FROM active WHERE extract(year from age(data_nascimento))::int BETWEEN 12 AND 17),
    'faixa_18_25', (SELECT count(*) FROM active WHERE extract(year from age(data_nascimento))::int BETWEEN 18 AND 25),
    'categoria', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', code, 'value', c)),'[]'::jsonb)
                  FROM (SELECT categoria::text AS code, count(*)::int c FROM active WHERE categoria IS NOT NULL GROUP BY categoria) x),
    'escolaridade', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', code, 'value', c)),'[]'::jsonb)
                     FROM (SELECT escolaridade::text AS code, count(*)::int c FROM active WHERE escolaridade IS NOT NULL GROUP BY escolaridade) x),
    'ocupacao', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', code, 'value', c)),'[]'::jsonb)
                 FROM (SELECT ocupacao::text AS code, count(*)::int c FROM active WHERE ocupacao IS NOT NULL GROUP BY ocupacao) x),
    'estado_civil', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', code, 'value', c)),'[]'::jsonb)
                     FROM (SELECT estado_civil::text AS code, count(*)::int c FROM active WHERE estado_civil IS NOT NULL GROUP BY estado_civil) x),
    'origem', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', code, 'value', c)),'[]'::jsonb)
               FROM (SELECT origem::text AS code, count(*)::int c FROM active WHERE origem IS NOT NULL GROUP BY origem) x),
    'motivo_inactividade', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', code, 'value', c)),'[]'::jsonb)
                            FROM (SELECT motivo_inactividade::text AS code, count(*)::int c FROM j WHERE activo = false AND motivo_inactividade IS NOT NULL GROUP BY motivo_inactividade) x),
    'igrejas_top', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'value', value)),'[]'::jsonb) FROM by_church)
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.public_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_dashboard_stats() TO anon, authenticated;

-- 4. Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_unique_local_secretary() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_jovens_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role must remain callable by authenticated (used in RLS policies), but revoke from anon
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 5. Storage: ownership-checked policies for documentos-jovens
DROP POLICY IF EXISTS "Authenticated upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated view docs" ON storage.objects;

CREATE POLICY "docs jovens select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documentos-jovens' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE ue.user_id = auth.uid()
        AND j.id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "docs jovens insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documentos-jovens' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE ue.user_id = auth.uid()
        AND j.id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "docs jovens update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documentos-jovens' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE ue.user_id = auth.uid()
        AND j.id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "docs jovens delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documentos-jovens' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE ue.user_id = auth.uid()
        AND j.id::text = (storage.foldername(name))[1]
    )
  )
);
