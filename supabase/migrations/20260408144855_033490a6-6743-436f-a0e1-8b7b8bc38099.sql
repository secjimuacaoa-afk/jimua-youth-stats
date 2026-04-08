
-- 1. Create new hierarchy tables
CREATE TABLE public.intendencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.circuitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  intendencia_id uuid NOT NULL REFERENCES public.intendencias(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nome, intendencia_id)
);

CREATE TABLE public.igrejas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  circuito_id uuid NOT NULL REFERENCES public.circuitos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nome, circuito_id)
);

-- 2. Enable RLS
ALTER TABLE public.intendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igrejas ENABLE ROW LEVEL SECURITY;

-- 3. RLS for new tables
CREATE POLICY "Admins manage intendencias" ON public.intendencias FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth view intendencias" ON public.intendencias FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage circuitos" ON public.circuitos FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth view circuitos" ON public.circuitos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage igrejas" ON public.igrejas FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth view igrejas" ON public.igrejas FOR SELECT TO authenticated USING (true);

-- 4. Migrate data
INSERT INTO public.intendencias (nome)
SELECT DISTINCT intendencia FROM public.estruturas ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.circuitos (nome, intendencia_id)
SELECT DISTINCT e.circuito, i.id FROM public.estruturas e
JOIN public.intendencias i ON i.nome = e.intendencia
ON CONFLICT (nome, intendencia_id) DO NOTHING;

INSERT INTO public.igrejas (nome, circuito_id)
SELECT DISTINCT e.cargo_pastoral, c.id FROM public.estruturas e
JOIN public.intendencias i ON i.nome = e.intendencia
JOIN public.circuitos c ON c.nome = e.circuito AND c.intendencia_id = i.id
ON CONFLICT (nome, circuito_id) DO NOTHING;

-- 5. Add igreja_id columns
ALTER TABLE public.jovens ADD COLUMN igreja_id uuid REFERENCES public.igrejas(id);
ALTER TABLE public.user_estruturas ADD COLUMN igreja_id uuid REFERENCES public.igrejas(id);
ALTER TABLE public.relatorios ADD COLUMN igreja_id uuid REFERENCES public.igrejas(id);

-- 6. Migrate FK data
UPDATE public.jovens j SET igreja_id = ig.id
FROM public.estruturas e
JOIN public.intendencias i ON i.nome = e.intendencia
JOIN public.circuitos c ON c.nome = e.circuito AND c.intendencia_id = i.id
JOIN public.igrejas ig ON ig.nome = e.cargo_pastoral AND ig.circuito_id = c.id
WHERE j.estrutura_id = e.id;

UPDATE public.user_estruturas ue SET igreja_id = ig.id
FROM public.estruturas e
JOIN public.intendencias i ON i.nome = e.intendencia
JOIN public.circuitos c ON c.nome = e.circuito AND c.intendencia_id = i.id
JOIN public.igrejas ig ON ig.nome = e.cargo_pastoral AND ig.circuito_id = c.id
WHERE ue.estrutura_id = e.id;

UPDATE public.relatorios r SET igreja_id = ig.id
FROM public.estruturas e
JOIN public.intendencias i ON i.nome = e.intendencia
JOIN public.circuitos c ON c.nome = e.circuito AND c.intendencia_id = i.id
JOIN public.igrejas ig ON ig.nome = e.cargo_pastoral AND ig.circuito_id = c.id
WHERE r.estrutura_id = e.id;

-- 7. Drop ALL old policies that depend on estrutura_id
DROP POLICY IF EXISTS "Locals can view jovens of their estrutura" ON public.jovens;
DROP POLICY IF EXISTS "Locals can insert jovens in their estrutura" ON public.jovens;
DROP POLICY IF EXISTS "Locals can update jovens in their estrutura" ON public.jovens;
DROP POLICY IF EXISTS "Locals can insert relatorios in their estrutura" ON public.relatorios;
DROP POLICY IF EXISTS "Locals can update relatorios of their estrutura" ON public.relatorios;
DROP POLICY IF EXISTS "Locals can view relatorios of their estrutura" ON public.relatorios;
DROP POLICY IF EXISTS "Users can view their estruturas" ON public.estruturas;
DROP POLICY IF EXISTS "Admins can manage estruturas" ON public.estruturas;
DROP POLICY IF EXISTS "Admins can manage user_estruturas" ON public.user_estruturas;
DROP POLICY IF EXISTS "Users can view own user_estruturas" ON public.user_estruturas;

-- 8. Drop old columns
ALTER TABLE public.jovens DROP COLUMN estrutura_id;
ALTER TABLE public.user_estruturas DROP COLUMN estrutura_id;
ALTER TABLE public.relatorios DROP COLUMN estrutura_id;

-- 9. Drop old table
DROP TABLE public.estruturas;

-- 10. Create new RLS policies using igreja_id
CREATE POLICY "Locals view jovens" ON public.jovens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_estruturas WHERE user_id = auth.uid() AND igreja_id = jovens.igreja_id)
);
CREATE POLICY "Locals insert jovens" ON public.jovens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_estruturas WHERE user_id = auth.uid() AND igreja_id = jovens.igreja_id)
);
CREATE POLICY "Locals update jovens" ON public.jovens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_estruturas WHERE user_id = auth.uid() AND igreja_id = jovens.igreja_id)
);

CREATE POLICY "Locals view relatorios" ON public.relatorios FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_estruturas WHERE user_id = auth.uid() AND igreja_id = relatorios.igreja_id)
);
CREATE POLICY "Locals insert relatorios" ON public.relatorios FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_estruturas WHERE user_id = auth.uid() AND igreja_id = relatorios.igreja_id)
);
CREATE POLICY "Locals update relatorios" ON public.relatorios FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_estruturas WHERE user_id = auth.uid() AND igreja_id = relatorios.igreja_id)
);

CREATE POLICY "Admins manage user_estruturas" ON public.user_estruturas FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own user_estruturas" ON public.user_estruturas FOR SELECT USING (auth.uid() = user_id);
