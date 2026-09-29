-- Step 3.1: Harden Workflow Atomicity, Activity Immutability & Concurrency Control
-- Implements single-transaction PostgreSQL functions with exclusive row locks (FOR UPDATE),
-- strict state machine transitions, concurrent lost-update prevention, and activity immutability triggers.

-- 1. Prevent updates or deletes on append-only audit trail
CREATE OR REPLACE FUNCTION public.prevent_leak_activity_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit activity log records are immutable and cannot be updated or deleted' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS t_leak_activity_immutable ON public.erp_leak_activity;
CREATE TRIGGER t_leak_activity_immutable
BEFORE UPDATE OR DELETE ON public.erp_leak_activity
FOR EACH ROW EXECUTE FUNCTION public.prevent_leak_activity_mutation();

-- 2. Atomic leak status transition + audit log
CREATE OR REPLACE FUNCTION public.workflow_update_leak_status(
  p_leak_id uuid,
  p_actor_id uuid,
  p_next_status text,
  p_expected_status text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_leak public.erp_leaks%ROWTYPE;
  v_prev_status text;
  v_activity_id uuid;
  v_now timestamptz := now();
  v_is_terminal boolean;
  v_resolution_notes text;
  v_resolved_at timestamptz;
BEGIN
  -- Acquire row lock to eliminate lost updates
  SELECT * INTO v_leak
  FROM public.erp_leaks
  WHERE id = p_leak_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leak finding not found' USING ERRCODE = 'P0002';
  END IF;

  v_prev_status := v_leak.status;

  -- Optimistic / stale transition check
  IF p_expected_status IS NOT NULL AND v_prev_status <> p_expected_status THEN
    RAISE EXCEPTION 'Concurrency conflict: Leak status was modified from % to % by another transaction',
      p_expected_status, v_prev_status USING ERRCODE = '40001';
  END IF;

  -- No-op if already in target status
  IF v_prev_status = p_next_status THEN
    RETURN jsonb_build_object('success', true, 'leak', to_jsonb(v_leak), 'activity_id', NULL);
  END IF;

  -- State machine transition validation
  IF NOT (
    (v_prev_status = 'detected' AND p_next_status IN ('investigating', 'dismissed')) OR
    (v_prev_status = 'investigating' AND p_next_status IN ('recovering', 'dismissed')) OR
    (v_prev_status = 'recovering' AND p_next_status = 'recovered')
  ) THEN
    RAISE EXCEPTION 'Cannot transition leak from % to %', v_prev_status, p_next_status USING ERRCODE = '22023';
  END IF;

  v_is_terminal := (p_next_status IN ('recovered', 'dismissed'));
  v_resolved_at := CASE WHEN v_is_terminal THEN v_now ELSE NULL END;
  v_resolution_notes := CASE 
    WHEN v_is_terminal AND p_notes IS NOT NULL AND length(trim(p_notes)) > 0 THEN trim(p_notes)
    ELSE v_leak.resolution_notes
  END;

  -- Update leak
  UPDATE public.erp_leaks
  SET status = p_next_status,
      resolved_at = v_resolved_at,
      resolution_notes = v_resolution_notes,
      updated_at = v_now
  WHERE id = p_leak_id
  RETURNING * INTO v_leak;

  -- Insert audit log in same atomic transaction
  INSERT INTO public.erp_leak_activity (
    leak_id, user_id, actor_id, action, metadata, created_at
  )
  VALUES (
    p_leak_id,
    v_leak.user_id,
    p_actor_id,
    'status_change',
    jsonb_build_object(
      'from', v_prev_status,
      'to', p_next_status,
      'notes', CASE WHEN p_notes IS NOT NULL AND length(trim(p_notes)) > 0 THEN trim(p_notes) ELSE NULL END
    ),
    v_now
  )
  RETURNING id INTO v_activity_id;

  RETURN jsonb_build_object(
    'success', true,
    'leak', to_jsonb(v_leak),
    'activity_id', v_activity_id
  );
END;
$$;

-- 3. Atomic leak assignment + audit log
CREATE OR REPLACE FUNCTION public.workflow_assign_leak(
  p_leak_id uuid,
  p_actor_id uuid,
  p_new_assignee uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_leak public.erp_leaks%ROWTYPE;
  v_prev_assignee uuid;
  v_activity_id uuid;
  v_now timestamptz := now();
  v_profile_status text;
BEGIN
  SELECT * INTO v_leak
  FROM public.erp_leaks
  WHERE id = p_leak_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leak finding not found' USING ERRCODE = 'P0002';
  END IF;

  v_prev_assignee := v_leak.assigned_to;

  IF p_new_assignee IS NOT NULL THEN
    SELECT status INTO v_profile_status
    FROM public.profiles
    WHERE id = p_new_assignee;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Target assignee does not exist' USING ERRCODE = 'P0002';
    END IF;

    IF v_profile_status = 'suspended' THEN
      RAISE EXCEPTION 'Cannot assign leak to a suspended member' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF v_prev_assignee IS NOT DISTINCT FROM p_new_assignee THEN
    RETURN jsonb_build_object('success', true, 'leak', to_jsonb(v_leak), 'activity_id', NULL);
  END IF;

  UPDATE public.erp_leaks
  SET assigned_to = p_new_assignee,
      updated_at = v_now
  WHERE id = p_leak_id
  RETURNING * INTO v_leak;

  INSERT INTO public.erp_leak_activity (
    leak_id, user_id, actor_id, action, metadata, created_at
  )
  VALUES (
    p_leak_id,
    v_leak.user_id,
    p_actor_id,
    'assigned',
    jsonb_build_object('previous_assignee', v_prev_assignee, 'new_assignee', p_new_assignee),
    v_now
  )
  RETURNING id INTO v_activity_id;

  RETURN jsonb_build_object('success', true, 'leak', to_jsonb(v_leak), 'activity_id', v_activity_id);
END;
$$;

-- 4. Atomic investigation note
CREATE OR REPLACE FUNCTION public.workflow_add_leak_note(
  p_leak_id uuid,
  p_actor_id uuid,
  p_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_user_id uuid;
  v_activity public.erp_leak_activity%ROWTYPE;
BEGIN
  IF p_note IS NULL OR length(trim(p_note)) = 0 THEN
    RAISE EXCEPTION 'Note content cannot be empty' USING ERRCODE = '22023';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.erp_leaks
  WHERE id = p_leak_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leak finding not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.erp_leak_activity (
    leak_id, user_id, actor_id, action, metadata
  )
  VALUES (
    p_leak_id,
    v_user_id,
    p_actor_id,
    'note_added',
    jsonb_build_object('note', trim(p_note))
  )
  RETURNING * INTO v_activity;

  RETURN to_jsonb(v_activity);
END;
$$;

-- 5. Atomic recovery case opening + parent leak transition
CREATE OR REPLACE FUNCTION public.workflow_open_recovery_case(
  p_leak_id uuid,
  p_actor_id uuid,
  p_target_amount numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_claim_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_leak public.erp_leaks%ROWTYPE;
  v_recovery public.erp_recovery_cases%ROWTYPE;
  v_target numeric;
  v_now timestamptz := now();
  v_activity_id uuid;
BEGIN
  SELECT * INTO v_leak
  FROM public.erp_leaks
  WHERE id = p_leak_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leak finding not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_leak.status IN ('recovered', 'dismissed') THEN
    RAISE EXCEPTION 'Cannot open recovery on a % leak', v_leak.status USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.erp_recovery_cases
    WHERE leak_id = p_leak_id AND closed_at IS NULL AND stage <> 'recovered'
  ) THEN
    RAISE EXCEPTION 'An active recovery case already exists for this leak' USING ERRCODE = '23505';
  END IF;

  v_target := COALESCE(p_target_amount, v_leak.amount);

  INSERT INTO public.erp_recovery_cases (
    leak_id, user_id, owner_id, stage, target_amount, recovered_amount,
    currency, claim_reference, notes, opened_at, created_at, updated_at
  )
  VALUES (
    p_leak_id, v_leak.user_id, p_actor_id, 'identified', v_target, 0.00,
    v_leak.currency, trim(p_claim_reference), trim(p_notes), v_now, v_now, v_now
  )
  RETURNING * INTO v_recovery;

  IF v_leak.status <> 'recovering' THEN
    UPDATE public.erp_leaks
    SET status = 'recovering', updated_at = v_now
    WHERE id = p_leak_id
    RETURNING * INTO v_leak;
  END IF;

  INSERT INTO public.erp_leak_activity (
    leak_id, user_id, actor_id, action, metadata, created_at
  )
  VALUES (
    p_leak_id,
    v_leak.user_id,
    p_actor_id,
    'recovery_opened',
    jsonb_build_object(
      'recovery_case_id', v_recovery.id,
      'target_amount', v_target,
      'currency', v_leak.currency,
      'claim_reference', trim(p_claim_reference)
    ),
    v_now
  )
  RETURNING id INTO v_activity_id;

  RETURN jsonb_build_object(
    'recovery_case', to_jsonb(v_recovery),
    'leak', to_jsonb(v_leak),
    'activity_id', v_activity_id
  );
END;
$$;

-- 6. Atomic recovery case update + parent leak resolution
CREATE OR REPLACE FUNCTION public.workflow_update_recovery_case(
  p_recovery_case_id uuid,
  p_actor_id uuid,
  p_next_stage text DEFAULT NULL,
  p_recovered_amount numeric DEFAULT NULL,
  p_claim_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_owner_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_recovery public.erp_recovery_cases%ROWTYPE;
  v_leak public.erp_leaks%ROWTYPE;
  v_prev_stage text;
  v_now timestamptz := now();
  v_will_be_recovered boolean;
  v_activity_id uuid;
BEGIN
  SELECT * INTO v_recovery
  FROM public.erp_recovery_cases
  WHERE id = p_recovery_case_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recovery case not found' USING ERRCODE = 'P0002';
  END IF;

  v_prev_stage := v_recovery.stage;

  IF p_next_stage IS NOT NULL AND p_next_stage <> v_prev_stage THEN
    IF NOT (
      (v_prev_stage = 'identified' AND p_next_stage IN ('vendor_contacted', 'claim_filed')) OR
      (v_prev_stage = 'vendor_contacted' AND p_next_stage IN ('claim_filed', 'credit_issued', 'recovered')) OR
      (v_prev_stage = 'claim_filed' AND p_next_stage IN ('credit_issued', 'recovered')) OR
      (v_prev_stage = 'credit_issued' AND p_next_stage = 'recovered')
    ) THEN
      RAISE EXCEPTION 'Cannot transition recovery stage from % to %', v_prev_stage, p_next_stage USING ERRCODE = '22023';
    END IF;
  END IF;

  v_will_be_recovered := (p_next_stage = 'recovered');

  UPDATE public.erp_recovery_cases
  SET stage = COALESCE(p_next_stage, stage),
      recovered_amount = COALESCE(p_recovered_amount, recovered_amount),
      claim_reference = CASE WHEN p_claim_reference IS NOT NULL THEN trim(p_claim_reference) ELSE claim_reference END,
      notes = CASE WHEN p_notes IS NOT NULL THEN trim(p_notes) ELSE notes END,
      owner_id = COALESCE(p_owner_id, owner_id),
      closed_at = CASE WHEN v_will_be_recovered THEN v_now ELSE closed_at END,
      updated_at = v_now
  WHERE id = p_recovery_case_id
  RETURNING * INTO v_recovery;

  IF v_will_be_recovered THEN
    UPDATE public.erp_leaks
    SET status = 'recovered',
        resolved_at = v_now,
        resolution_notes = COALESCE(p_notes, v_recovery.notes, 'Recovered via recovery case'),
        updated_at = v_now
    WHERE id = v_recovery.leak_id
    RETURNING * INTO v_leak;
  END IF;

  INSERT INTO public.erp_leak_activity (
    leak_id, user_id, actor_id, action, metadata, created_at
  )
  VALUES (
    v_recovery.leak_id,
    v_recovery.user_id,
    p_actor_id,
    CASE WHEN p_next_stage IS NOT NULL AND p_next_stage <> v_prev_stage THEN 'recovery_stage_changed' ELSE 'recovery_updated' END,
    jsonb_build_object(
      'recovery_case_id', p_recovery_case_id,
      'from_stage', v_prev_stage,
      'to_stage', COALESCE(p_next_stage, v_prev_stage),
      'recovered_amount', v_recovery.recovered_amount,
      'claim_reference', v_recovery.claim_reference
    ),
    v_now
  )
  RETURNING id INTO v_activity_id;

  RETURN jsonb_build_object(
    'recovery_case', to_jsonb(v_recovery),
    'leak', CASE WHEN v_will_be_recovered THEN to_jsonb(v_leak) ELSE NULL END,
    'activity_id', v_activity_id
  );
END;
$$;

-- Permissions for authenticated users to execute workflow RPC functions
GRANT EXECUTE ON FUNCTION public.workflow_update_leak_status(uuid, uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.workflow_assign_leak(uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.workflow_add_leak_note(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.workflow_open_recovery_case(uuid, uuid, numeric, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.workflow_update_recovery_case(uuid, uuid, text, numeric, text, text, uuid) TO authenticated, service_role;
