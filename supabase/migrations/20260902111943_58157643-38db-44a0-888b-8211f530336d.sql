-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin','cfo','finance_manager','accountant','procurement_manager','auditor','viewer');
CREATE TYPE public.app_permission AS ENUM ('view','create','edit','delete','approve','recover','manage_users','manage_roles','export','configure');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Permission matrix
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

INSERT INTO public.role_permissions (role, permission) VALUES
 ('admin','view'),('admin','create'),('admin','edit'),('admin','delete'),('admin','approve'),('admin','recover'),('admin','manage_users'),('admin','manage_roles'),('admin','export'),('admin','configure'),
 ('cfo','view'),('cfo','approve'),('cfo','recover'),('cfo','export'),
 ('finance_manager','view'),('finance_manager','create'),('finance_manager','edit'),('finance_manager','approve'),('finance_manager','recover'),('finance_manager','export'),
 ('accountant','view'),('accountant','create'),('accountant','edit'),('accountant','export'),
 ('procurement_manager','view'),('procurement_manager','create'),('procurement_manager','edit'),('procurement_manager','approve'),('procurement_manager','export'),
 ('auditor','view'),('auditor','export'),
 ('viewer','view');

-- Profiles extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Bootstrap: first user is admin, everyone else viewer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, company, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'company', NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

-- Backfill existing users
INSERT INTO public.profiles (id, email)
SELECT u.id, u.email FROM auth.users u
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, CASE WHEN u.created_at = (SELECT min(created_at) FROM auth.users) THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;