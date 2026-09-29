CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "admins read all roles" ON public.user_roles;
CREATE POLICY "admins read all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "admins read all profiles" ON public.profiles;
CREATE POLICY "admins read all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "admins update all profiles" ON public.profiles;
CREATE POLICY "admins update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.has_role(uuid, public.app_role);

CREATE POLICY "server only oauth state" ON public.erp_oauth_states
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "server only provider config" ON public.erp_provider_config
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;