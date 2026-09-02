CREATE OR REPLACE FUNCTION public.public_dashboard_stats(_distrito_id uuid DEFAULT NULL::uuid, _intendencia_id uuid DEFAULT NULL::uuid, _circuito_id uuid DEFAULT NULL::uuid, _igreja_id uuid DEFAULT NULL::uuid)
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
    SELECT id, sexo, activo, data_nascimento, categoria, escolaridade, ocupacao,
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
  ),
  oc AS (
    SELECT o.ano, o.semestre, o.tipo_categoria, o.tipo_codigo
    FROM public.ocorrencias o
    JOIN public.jovens jj ON jj.id = o.jovem_id
    WHERE jj.igreja_id IN (SELECT id FROM scope)
  ),
  pe AS (
    SELECT p.ano, p.semestre,
           sum(coalesce(p.numero_anterior_real,0))::int AS base
    FROM public.periodos_estatisticos p
    WHERE p.igreja_id IN (SELECT id FROM scope)
    GROUP BY p.ano, p.semestre
  ),
  periodos AS (
    SELECT ano, semestre FROM oc
    UNION
    SELECT ano, semestre FROM pe
  ),
  serie AS (
    SELECT
      p.ano,
      p.semestre,
      coalesce((SELECT base FROM pe WHERE pe.ano = p.ano AND pe.semestre = p.semestre), 0) AS base,
      coalesce((SELECT count(*)::int FROM oc WHERE oc.ano = p.ano AND oc.semestre = p.semestre AND oc.tipo_categoria = 'entrada'), 0) AS entradas,
      coalesce((SELECT count(*)::int FROM oc WHERE oc.ano = p.ano AND oc.semestre = p.semestre AND oc.tipo_categoria = 'saida'), 0) AS saidas,
      coalesce((SELECT count(*)::int FROM oc WHERE oc.ano = p.ano AND oc.semestre = p.semestre AND oc.tipo_codigo IN ('desistente','ausente_diversas')), 0) AS abandonos
    FROM periodos p
    ORDER BY p.ano, p.semestre
  ),
  serie_calc AS (
    SELECT ano, semestre, base, entradas, saidas, abandonos,
           (base + entradas - saidas) AS actual,
           CASE WHEN (base + entradas) > 0
                THEN round((abandonos::numeric * 100) / (base + entradas), 1)
                ELSE 0 END AS taxa_abandono
    FROM serie
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
    'igrejas_top', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', name, 'value', value)),'[]'::jsonb) FROM by_church),
    'serie_semestral', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                          'ano', ano, 'semestre', semestre, 'base', base,
                          'entradas', entradas, 'saidas', saidas, 'abandonos', abandonos,
                          'actual', actual, 'taxa_abandono', taxa_abandono
                        ) ORDER BY ano, semestre), '[]'::jsonb) FROM serie_calc)
  ) INTO result;
  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.public_dashboard_stats(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_dashboard_stats(uuid, uuid, uuid, uuid) TO anon, authenticated;