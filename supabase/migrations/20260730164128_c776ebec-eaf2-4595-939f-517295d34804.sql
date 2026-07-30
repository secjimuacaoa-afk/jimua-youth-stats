REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_unique_local_secretary() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_jovens_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ocorrencia_apply_estado() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_bi_obrigatorio() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_semester_lock_jovens() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_semester_lock_ocorrencias() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_semester_lock_actividades() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assembleia_bloqueia(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.jovens_a_transferir() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.public_dashboard_stats() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assembleia_bloqueia(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jovens_a_transferir() TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_dashboard_stats() TO anon, authenticated;