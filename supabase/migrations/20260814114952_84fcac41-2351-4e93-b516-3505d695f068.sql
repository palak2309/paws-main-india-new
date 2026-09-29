CREATE TABLE public.erp_provider_config (
  provider text PRIMARY KEY,
  client_id text NOT NULL,
  client_secret_ciphertext text NOT NULL,
  extra_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  configured_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.erp_provider_config TO service_role;
ALTER TABLE public.erp_provider_config ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_provider_config_updated BEFORE UPDATE ON public.erp_provider_config FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();