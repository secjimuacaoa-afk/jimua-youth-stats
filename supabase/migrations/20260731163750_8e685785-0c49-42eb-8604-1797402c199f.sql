REVOKE ALL ON FUNCTION public.assembleia_bloqueia(uuid,integer,integer) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.igreja_distrito(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.semestre_bloqueado(uuid,integer,integer) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.jovens_a_transferir() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.public_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_dashboard_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jovens_a_transferir() TO authenticated;