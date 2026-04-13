
-- 1. Create distritos table
CREATE TABLE public.distritos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.distritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage distritos" ON public.distritos FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins view distritos" ON public.distritos FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Public can view distritos" ON public.distritos FOR SELECT TO anon
  USING (true);

-- 2. Add distrito_id to intendencias
ALTER TABLE public.intendencias ADD COLUMN distrito_id uuid REFERENCES public.distritos(id);

-- 3. Add new columns to jovens
ALTER TABLE public.jovens ADD COLUMN IF NOT EXISTS semestre integer NOT NULL DEFAULT 1;
ALTER TABLE public.jovens ADD COLUMN IF NOT EXISTS ano_semestre integer NOT NULL DEFAULT 2026;
ALTER TABLE public.jovens ADD COLUMN IF NOT EXISTS documento_url text;

-- 4. Add distrito_id to user_estruturas
ALTER TABLE public.user_estruturas ADD COLUMN distrito_id uuid REFERENCES public.distritos(id);

-- 5. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-jovens', 'documentos-jovens', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated upload docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-jovens');
CREATE POLICY "Authenticated view docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-jovens');

-- 6. Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, tipo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'tipo')::user_tipo, 'local'));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'tipo')::app_role, 'local'));
  RETURN NEW;
END;
$$;

-- 7. Update has_role: super_admin inherits admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = _role OR (role = 'super_admin' AND _role = 'admin'))
  )
$$;

-- 8. Update audit trigger
CREATE OR REPLACE FUNCTION public.audit_jovens_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE col text; old_val text; new_val text;
  cols text[] := ARRAY['nome','sexo','data_nascimento','categoria','escolaridade','ocupacao','estado_civil','activo','motivo_inactividade','origem','igreja_id','documentacao','is_oja','semestre','ano_semestre','documento_url'];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col, col) INTO old_val, new_val USING OLD, NEW;
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO public.jovens_audit (jovem_id, campo, valor_anterior, valor_novo, alterado_por)
      VALUES (NEW.id, col, old_val, new_val, auth.uid());
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- 9. Super admin RLS on existing tables
CREATE POLICY "Super admins manage circuitos" ON public.circuitos FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage igrejas" ON public.igrejas FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage intendencias" ON public.intendencias FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage jovens" ON public.jovens FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins view audit" ON public.jovens_audit FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage user_estruturas" ON public.user_estruturas FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage user_roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins manage relatorios" ON public.relatorios FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- 10. Public read for aggregated stats
CREATE POLICY "Public view jovens stats" ON public.jovens FOR SELECT TO anon USING (true);
CREATE POLICY "Public view igrejas" ON public.igrejas FOR SELECT TO anon USING (true);
CREATE POLICY "Public view circuitos" ON public.circuitos FOR SELECT TO anon USING (true);
CREATE POLICY "Public view intendencias" ON public.intendencias FOR SELECT TO anon USING (true);
