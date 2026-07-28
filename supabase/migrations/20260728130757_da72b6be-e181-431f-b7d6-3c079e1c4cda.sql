
-- 1) Scope assembleias SELECT by jurisdiction
DROP POLICY IF EXISTS assembleias_select_auth ON public.assembleias;
CREATE POLICY assembleias_select_by_jurisdiction ON public.assembleias
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR estrutura_tipo = 'nacional'
    OR (
      estrutura_tipo = 'distrito'
      AND EXISTS (
        SELECT 1 FROM public.user_estruturas ue
        WHERE ue.user_id = auth.uid() AND ue.distrito_id = assembleias.estrutura_id
      )
    )
  );

-- 2) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated/public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_unique_local_secretary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_jovens_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ocorrencia_apply_estado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Keep necessary grants
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

GRANT EXECUTE ON FUNCTION public.public_dashboard_stats() TO anon, authenticated;
