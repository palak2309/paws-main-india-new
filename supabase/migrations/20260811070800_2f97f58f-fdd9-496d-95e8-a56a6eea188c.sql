CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  company text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'company')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.erp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  account_name text,
  external_account_id text,
  status text NOT NULL DEFAULT 'pending',
  last_sync_at timestamptz,
  last_error text,
  credentials_ciphertext text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, external_account_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_connections TO authenticated;
GRANT ALL ON public.erp_connections TO service_role;
ALTER TABLE public.erp_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connections" ON public.erp_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
REVOKE SELECT (credentials_ciphertext) ON public.erp_connections FROM authenticated;

CREATE TABLE public.erp_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  status text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_vendors TO authenticated;
GRANT ALL ON public.erp_vendors TO service_role;
ALTER TABLE public.erp_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vendors" ON public.erp_vendors FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.erp_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  invoice_number text,
  vendor_name text,
  vendor_external_id text,
  issue_date date,
  due_date date,
  amount numeric(18,2),
  tax_amount numeric(18,2),
  amount_paid numeric(18,2),
  currency text,
  status text,
  type text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_invoices TO authenticated;
GRANT ALL ON public.erp_invoices TO service_role;
ALTER TABLE public.erp_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invoices" ON public.erp_invoices FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.erp_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  reference text,
  invoice_external_id text,
  vendor_name text,
  paid_date date,
  amount numeric(18,2),
  currency text,
  method text,
  status text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_payments TO authenticated;
GRANT ALL ON public.erp_payments TO service_role;
ALTER TABLE public.erp_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments" ON public.erp_payments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.erp_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  name text,
  vendor_name text,
  start_date date,
  end_date date,
  value numeric(18,2),
  currency text,
  status text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_contracts TO authenticated;
GRANT ALL ON public.erp_contracts TO service_role;
ALTER TABLE public.erp_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contracts" ON public.erp_contracts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.erp_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  invoices_synced integer NOT NULL DEFAULT 0,
  payments_synced integer NOT NULL DEFAULT 0,
  vendors_synced integer NOT NULL DEFAULT 0,
  contracts_synced integer NOT NULL DEFAULT 0,
  error text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_sync_runs TO authenticated;
GRANT ALL ON public.erp_sync_runs TO service_role;
ALTER TABLE public.erp_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sync runs" ON public.erp_sync_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.erp_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  code_verifier text,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.erp_oauth_states TO service_role;
ALTER TABLE public.erp_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_conn_updated BEFORE UPDATE ON public.erp_connections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_vendors_updated BEFORE UPDATE ON public.erp_vendors FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_invoices_updated BEFORE UPDATE ON public.erp_invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_payments_updated BEFORE UPDATE ON public.erp_payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_contracts_updated BEFORE UPDATE ON public.erp_contracts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();