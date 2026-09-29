-- Step 1: Persistent Financial Leakage Lifecycle & Recovery Foundation
-- Creates erp_leaks, erp_leak_activity, and erp_recovery_cases with RLS and indexing.

-- 1. Durable Financial Leak Cases
CREATE TABLE public.erp_leaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.erp_connections(id) ON DELETE SET NULL,
  fingerprint text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  vendor_name text NOT NULL,
  amount numeric(18,2) NOT NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'USD',
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'recovering', 'recovered', 'dismissed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'rule_engine',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolution_notes text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_erp_leaks_user_fingerprint UNIQUE (user_id, fingerprint)
);

-- 2. Append-Only Audit & Activity History
CREATE TABLE public.erp_leak_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leak_id uuid NOT NULL REFERENCES public.erp_leaks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Recovery Cases
CREATE TABLE public.erp_recovery_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leak_id uuid NOT NULL REFERENCES public.erp_leaks(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'identified' CHECK (stage IN ('identified', 'vendor_contacted', 'claim_filed', 'credit_issued', 'recovered')),
  target_amount numeric(18,2) NOT NULL DEFAULT 0.00,
  recovered_amount numeric(18,2) NOT NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'USD',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_reference text,
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enforce at most one active (unclosed/unrecovered) recovery case per leak
CREATE UNIQUE INDEX uq_recovery_active_leak
ON public.erp_recovery_cases (leak_id)
WHERE (stage != 'recovered' AND closed_at IS NULL);

-- Timestamp triggers
CREATE TRIGGER t_leaks_updated BEFORE UPDATE ON public.erp_leaks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_recovery_cases_updated BEFORE UPDATE ON public.erp_recovery_cases FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Query Optimization Indexes
CREATE INDEX idx_erp_leaks_user_id ON public.erp_leaks (user_id);
CREATE INDEX idx_erp_leaks_connection_id ON public.erp_leaks (connection_id);
CREATE INDEX idx_erp_leaks_status ON public.erp_leaks (user_id, status);
CREATE INDEX idx_erp_leaks_severity ON public.erp_leaks (user_id, severity);
CREATE INDEX idx_erp_leaks_assigned_to ON public.erp_leaks (assigned_to);
CREATE INDEX idx_erp_leaks_detected_at ON public.erp_leaks (user_id, detected_at DESC);
CREATE INDEX idx_erp_leaks_type ON public.erp_leaks (user_id, type);

CREATE INDEX idx_erp_leak_activity_leak_id ON public.erp_leak_activity (leak_id, created_at DESC);
CREATE INDEX idx_erp_leak_activity_user_id ON public.erp_leak_activity (user_id);
CREATE INDEX idx_erp_leak_activity_actor_id ON public.erp_leak_activity (actor_id);

CREATE INDEX idx_erp_recovery_cases_user_id ON public.erp_recovery_cases (user_id);
CREATE INDEX idx_erp_recovery_cases_leak_id ON public.erp_recovery_cases (leak_id);
CREATE INDEX idx_erp_recovery_cases_stage ON public.erp_recovery_cases (user_id, stage);
CREATE INDEX idx_erp_recovery_cases_owner_id ON public.erp_recovery_cases (owner_id);
CREATE INDEX idx_erp_recovery_cases_opened_at ON public.erp_recovery_cases (user_id, opened_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_leaks TO authenticated;
GRANT ALL ON public.erp_leaks TO service_role;

GRANT SELECT, INSERT ON public.erp_leak_activity TO authenticated;
GRANT ALL ON public.erp_leak_activity TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_recovery_cases TO authenticated;
GRANT ALL ON public.erp_recovery_cases TO service_role;

-- Row Level Security
ALTER TABLE public.erp_leaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_leak_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_recovery_cases ENABLE ROW LEVEL SECURITY;

-- erp_leaks RLS Policies
CREATE POLICY "user leaks select" ON public.erp_leaks FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = assigned_to OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "user leaks modify" ON public.erp_leaks FOR ALL TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

-- erp_leak_activity RLS Policies (Append-only from authenticated client)
CREATE POLICY "user leak activity select" ON public.erp_leak_activity FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "user leak activity insert" ON public.erp_leak_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

-- erp_recovery_cases RLS Policies
CREATE POLICY "user recovery cases select" ON public.erp_recovery_cases FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = owner_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "user recovery cases modify" ON public.erp_recovery_cases FOR ALL TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));
