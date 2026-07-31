CREATE OR REPLACE FUNCTION public.public_estruturas()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'distritos', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'nome', nome) ORDER BY nome), '[]'::jsonb) FROM public.distritos),
    'intendencias', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'nome', nome, 'distrito_id', distrito_id) ORDER BY nome), '[]'::jsonb) FROM public.intendencias),
    'circuitos', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'nome', nome, 'intendencia_id', intendencia_id) ORDER BY nome), '[]'::jsonb) FROM public.circuitos),
    'igrejas', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'nome', nome, 'circuito_id', circuito_id) ORDER BY nome), '[]'::jsonb) FROM public.igrejas)
  )
$$;

REVOKE ALL ON FUNCTION public.public_estruturas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_estruturas() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_dashboard_stats(
  _distrito_id uuid DEFAULT NULL,
  _intendencia_id uuid DEFAULT NULL,
  _circuito_id uuid DEFAULT NULL,
  _igreja_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE result jsonb;
BEGIN
  WITH scope AS (
    SELECT i.id
    FROM public.igrejas i
    JOIN public.circuitos c ON c.id = i.circuito_id
    JOIN public.intendencias it ON it.id = c.intendencia_id
    WHERE (_igreja_id IS NULL OR i.id = _igreja_id)
      AND (_circuito_id IS NULL OR c.id = _circuito_id)
      AND (_intendencia_id IS NULL OR it.id = _intendencia_id)
      AND (_distrito_id IS NULL OR it.distrito_id = _distrito_id)
  ),
  j AS (
    SELECT sexo, activo, data_nascimento, categoria, escolaridade, ocupacao,
           estado_civil, origem, motivo_inactividade, is_oja, igreja_id
    FROM public.jovens
    WHERE is_oja = false
      AND (igreja_id IN (SELECT id FROM scope))
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
$function$;

REVOKE ALL ON FUNCTION public.public_dashboard_stats(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_dashboard_stats(uuid, uuid, uuid, uuid) TO anon, authenticated;