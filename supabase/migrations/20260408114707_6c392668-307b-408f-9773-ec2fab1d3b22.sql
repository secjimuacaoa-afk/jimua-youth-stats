
-- Enums
CREATE TYPE public.user_tipo AS ENUM ('admin', 'local');
CREATE TYPE public.app_role AS ENUM ('admin', 'local');
CREATE TYPE public.sexo_tipo AS ENUM ('masculino', 'feminino');
CREATE TYPE public.relatorio_status AS ENUM ('rascunho', 'submetido', 'aprovado', 'rejeitado');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  tipo user_tipo NOT NULL DEFAULT 'local',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Estruturas (ecclesiastical hierarchy)
CREATE TABLE public.estruturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intendencia TEXT NOT NULL,
  circuito TEXT NOT NULL,
  cargo_pastoral TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.estruturas ENABLE ROW LEVEL SECURITY;

-- User-Estrutura relationship
CREATE TABLE public.user_estruturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estrutura_id UUID NOT NULL REFERENCES public.estruturas(id) ON DELETE CASCADE,
  UNIQUE (user_id, estrutura_id)
);
ALTER TABLE public.user_estruturas ENABLE ROW LEVEL SECURITY;

-- Jovens (youth records)
CREATE TABLE public.jovens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sexo sexo_tipo NOT NULL,
  data_nascimento DATE NOT NULL,
  categoria TEXT NOT NULL,
  escolaridade TEXT,
  ocupacao TEXT,
  estado_civil TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  motivo_inactividade TEXT,
  origem TEXT,
  estrutura_id UUID NOT NULL REFERENCES public.estruturas(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jovens ENABLE ROW LEVEL SECURITY;

-- Relatorios (semi-annual reports)
CREATE TABLE public.relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estrutura_id UUID NOT NULL REFERENCES public.estruturas(id) ON DELETE RESTRICT,
  ano INTEGER NOT NULL,
  semestre INTEGER NOT NULL CHECK (semestre IN (1, 2)),
  status relatorio_status NOT NULL DEFAULT 'rascunho',
  data_submissao TIMESTAMPTZ,
  comentario_admin TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estrutura_id, ano, semestre)
);
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_jovens_updated_at
  BEFORE UPDATE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'tipo')::user_tipo, 'local')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'tipo')::app_role, 'local')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User roles: admins manage, users see own
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Estruturas: admins manage, locals see their own
CREATE POLICY "Admins can manage estruturas" ON public.estruturas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their estruturas" ON public.estruturas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_estruturas
      WHERE user_id = auth.uid() AND estrutura_id = estruturas.id
    )
  );

-- User_estruturas
CREATE POLICY "Admins can manage user_estruturas" ON public.user_estruturas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own user_estruturas" ON public.user_estruturas
  FOR SELECT USING (auth.uid() = user_id);

-- Jovens: admins see all, locals see their estrutura
CREATE POLICY "Admins can manage jovens" ON public.jovens
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Locals can view jovens of their estrutura" ON public.jovens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_estruturas
      WHERE user_id = auth.uid() AND estrutura_id = jovens.estrutura_id
    )
  );
CREATE POLICY "Locals can insert jovens in their estrutura" ON public.jovens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_estruturas
      WHERE user_id = auth.uid() AND estrutura_id = jovens.estrutura_id
    )
  );
CREATE POLICY "Locals can update jovens in their estrutura" ON public.jovens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_estruturas
      WHERE user_id = auth.uid() AND estrutura_id = jovens.estrutura_id
    )
  );

-- Relatorios: admins see all, locals see their estrutura
CREATE POLICY "Admins can manage relatorios" ON public.relatorios
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Locals can view relatorios of their estrutura" ON public.relatorios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_estruturas
      WHERE user_id = auth.uid() AND estrutura_id = relatorios.estrutura_id
    )
  );
CREATE POLICY "Locals can insert relatorios in their estrutura" ON public.relatorios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_estruturas
      WHERE user_id = auth.uid() AND estrutura_id = relatorios.estrutura_id
    )
  );
CREATE POLICY "Locals can update relatorios of their estrutura" ON public.relatorios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_estruturas
      WHERE user_id = auth.uid() AND estrutura_id = relatorios.estrutura_id
    )
  );
