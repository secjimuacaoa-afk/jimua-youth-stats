
-- Add new columns to jovens
ALTER TABLE public.jovens ADD COLUMN IF NOT EXISTS documentacao text[] DEFAULT '{}';
ALTER TABLE public.jovens ADD COLUMN IF NOT EXISTS is_oja boolean NOT NULL DEFAULT false;

-- Create jovens_audit table
CREATE TABLE public.jovens_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jovem_id uuid NOT NULL,
  campo text NOT NULL,
  valor_anterior text,
  valor_novo text,
  alterado_por uuid,
  alterado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jovens_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all audit" ON public.jovens_audit
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Locals view audit of own church jovens" ON public.jovens_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jovens j
      JOIN public.user_estruturas ue ON ue.igreja_id = j.igreja_id
      WHERE j.id = jovens_audit.jovem_id AND ue.user_id = auth.uid()
    )
  );

-- Allow system inserts into audit (via trigger running as SECURITY DEFINER)
CREATE POLICY "System can insert audit" ON public.jovens_audit
  FOR INSERT WITH CHECK (true);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_jovens_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col text;
  old_val text;
  new_val text;
  cols text[] := ARRAY['nome','sexo','data_nascimento','categoria','escolaridade','ocupacao','estado_civil','activo','motivo_inactividade','origem','igreja_id','documentacao','is_oja'];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col, col)
      INTO old_val, new_val
      USING OLD, NEW;
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO public.jovens_audit (jovem_id, campo, valor_anterior, valor_novo, alterado_por)
      VALUES (NEW.id, col, old_val, new_val, auth.uid());
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_jovens
AFTER UPDATE ON public.jovens
FOR EACH ROW EXECUTE FUNCTION public.audit_jovens_changes();

-- Trigger to prevent two local secretaries for the same church
CREATE OR REPLACE FUNCTION public.check_unique_local_secretary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.igreja_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.user_estruturas ue
      JOIN public.profiles p ON p.id = ue.user_id
      WHERE ue.igreja_id = NEW.igreja_id
        AND p.tipo = 'local'
        AND ue.user_id != NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Esta igreja já tem um secretário local atribuído';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_unique_local_secretary
BEFORE INSERT OR UPDATE ON public.user_estruturas
FOR EACH ROW EXECUTE FUNCTION public.check_unique_local_secretary();

-- Add DELETE policy for jovens (admin and local)
CREATE POLICY "Admins can delete jovens" ON public.jovens
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Locals delete own church jovens" ON public.jovens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_estruturas
      WHERE user_estruturas.user_id = auth.uid()
        AND user_estruturas.igreja_id = jovens.igreja_id
    )
  );
