-- After trip_collaborators got status ('active'|'left'), every "is this user a
-- member of this trip" check must require status='active'. A 'left' row stays for
-- expense-history integrity but must not grant ongoing access.

-- ============================================================
-- Helper function
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_trip_member(check_trip_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = check_trip_id AND user_id = auth.uid() AND status = 'active'
  );
$$;

-- ============================================================
-- trips
-- ============================================================
DROP POLICY IF EXISTS "trips_select" ON trips;
CREATE POLICY "trips_select" ON trips
  FOR SELECT TO authenticated USING (
    id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "trips_update" ON trips;
CREATE POLICY "trips_update" ON trips
  FOR UPDATE TO authenticated USING (
    id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active')
  );

DROP POLICY IF EXISTS "trips_delete" ON trips;
CREATE POLICY "trips_delete" ON trips
  FOR DELETE TO authenticated USING (
    id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active')
  );

-- ============================================================
-- trip_collaborators
-- ============================================================
DROP POLICY IF EXISTS "trip_collaborators_insert_owner" ON trip_collaborators;
CREATE POLICY "trip_collaborators_insert_owner" ON trip_collaborators
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (
      SELECT trip_collaborators_1.trip_id FROM trip_collaborators trip_collaborators_1
      WHERE trip_collaborators_1.user_id = auth.uid() AND trip_collaborators_1.role = 'owner' AND trip_collaborators_1.status = 'active'
    )
  );

-- ============================================================
-- documents
-- ============================================================
DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "documents_insert" ON documents;
CREATE POLICY "documents_insert" ON documents
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

-- ============================================================
-- expenses
-- ============================================================
DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "expenses_insert" ON expenses;
CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE TO authenticated USING (
    payer_id = auth.uid()
    OR trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active')
  );

-- ============================================================
-- expense_splits
-- ============================================================
DROP POLICY IF EXISTS "expense_splits_select" ON expense_splits;
CREATE POLICY "expense_splits_select" ON expense_splits
  FOR SELECT TO authenticated USING (
    expense_id IN (
      SELECT e.id FROM expenses e JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE tc.user_id = auth.uid() AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS "expense_splits_insert" ON expense_splits;
CREATE POLICY "expense_splits_insert" ON expense_splits
  FOR INSERT TO authenticated WITH CHECK (
    expense_id IN (
      SELECT e.id FROM expenses e JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE tc.user_id = auth.uid() AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS "expense_splits_delete" ON expense_splits;
CREATE POLICY "expense_splits_delete" ON expense_splits
  FOR DELETE TO authenticated USING (
    expense_id IN (
      SELECT e.id FROM expenses e JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE tc.user_id = auth.uid() AND tc.status = 'active'
    )
  );

-- ============================================================
-- experiences
-- ============================================================
DROP POLICY IF EXISTS "experiences_select" ON experiences;
CREATE POLICY "experiences_select" ON experiences
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "experiences_insert" ON experiences;
CREATE POLICY "experiences_insert" ON experiences
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "experiences_update" ON experiences;
CREATE POLICY "experiences_update" ON experiences
  FOR UPDATE TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "experiences_delete" ON experiences;
CREATE POLICY "experiences_delete" ON experiences
  FOR DELETE TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

-- ============================================================
-- memories
-- ============================================================
DROP POLICY IF EXISTS "memories_select" ON memories;
CREATE POLICY "memories_select" ON memories
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "memories_insert" ON memories;
CREATE POLICY "memories_insert" ON memories
  FOR INSERT TO authenticated WITH CHECK (
    (trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active'))
    AND user_id = auth.uid()
  );

-- ============================================================
-- experience_ratings
-- ============================================================
DROP POLICY IF EXISTS "ratings_select" ON experience_ratings;
CREATE POLICY "ratings_select" ON experience_ratings
  FOR SELECT TO authenticated USING (
    experience_id IN (
      SELECT e.id FROM experiences e JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE tc.user_id = auth.uid() AND tc.status = 'active'
    )
  );

-- ============================================================
-- experience_attribute_ratings
-- ============================================================
DROP POLICY IF EXISTS "trip members can view attribute ratings" ON experience_attribute_ratings;
CREATE POLICY "trip members can view attribute ratings" ON experience_attribute_ratings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM experiences e JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE e.id = experience_attribute_ratings.experience_id AND tc.user_id = auth.uid() AND tc.status = 'active'
    )
  );

-- ============================================================
-- profiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR id IN (
      SELECT trip_collaborators.user_id FROM trip_collaborators
      WHERE trip_collaborators.trip_id IN (
        SELECT trip_collaborators_1.trip_id FROM trip_collaborators trip_collaborators_1
        WHERE trip_collaborators_1.user_id = auth.uid() AND trip_collaborators_1.status = 'active'
      )
    )
  );

-- ============================================================
-- trip_destinations
-- ============================================================
DROP POLICY IF EXISTS "trip_members_read_destinations" ON trip_destinations;
CREATE POLICY "trip_members_read_destinations" ON trip_destinations
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "trip_members_write_destinations" ON trip_destinations;
CREATE POLICY "trip_members_write_destinations" ON trip_destinations
  FOR ALL TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
  );

-- ============================================================
-- trip_settlements
-- ============================================================
DROP POLICY IF EXISTS "trip_collaborators_can_view_settlements" ON trip_settlements;
CREATE POLICY "trip_collaborators_can_view_settlements" ON trip_settlements
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM trip_collaborators tc
      WHERE tc.trip_id = trip_settlements.trip_id AND tc.user_id = auth.uid() AND tc.status = 'active'
    )
  );

-- ============================================================
-- storage: memories / documents
-- ============================================================
DROP POLICY IF EXISTS "memories_storage_insert" ON storage.objects;
CREATE POLICY "memories_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'memories'
    AND (storage.foldername(name))[1] = 'memories'
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "documents_storage_select" ON storage.objects;
CREATE POLICY "documents_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "documents_storage_insert" ON storage.objects;
CREATE POLICY "documents_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] IN (
      SELECT trip_id::text FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- RPCs: add status='active' to membership checks
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_expense_safe(p_expense_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_trip_id UUID; v_payer_id UUID; v_stale BOOLEAN := FALSE;
BEGIN
  SELECT trip_id, payer_id INTO v_trip_id, v_payer_id FROM expenses WHERE id = p_expense_id;
  IF NOT EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = v_trip_id AND user_id = auth.uid() AND status = 'active') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF v_payer_id != auth.uid() THEN RAISE EXCEPTION 'only_payer_can_delete'; END IF;
  SELECT EXISTS (SELECT 1 FROM (SELECT ts_u.from_user_id, COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.trip_id = v_trip_id AND e.payer_id = ts_u.from_user_id AND e.id != p_expense_id), 0) - COALESCE((SELECT SUM(es.amount) FROM expense_splits es JOIN expenses e ON e.id = es.expense_id WHERE e.trip_id = v_trip_id AND es.user_id = ts_u.from_user_id AND e.id != p_expense_id), 0) + COALESCE((SELECT SUM(s.amount) FROM trip_settlements s WHERE s.trip_id = v_trip_id AND s.from_user_id = ts_u.from_user_id), 0) - COALESCE((SELECT SUM(s.amount) FROM trip_settlements s WHERE s.trip_id = v_trip_id AND s.to_user_id = ts_u.from_user_id), 0) AS net_balance FROM (SELECT DISTINCT from_user_id FROM trip_settlements WHERE trip_id = v_trip_id) ts_u) balances WHERE net_balance > 0.005) INTO v_stale;
  IF v_stale THEN DELETE FROM trip_settlements WHERE trip_id = v_trip_id; END IF;
  DELETE FROM expenses WHERE id = p_expense_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.create_expense_with_splits(p_trip_id uuid, p_description text, p_amount numeric, p_payer_id uuid, p_experience_id uuid, p_participant_ids uuid[], p_currency text DEFAULT 'EUR'::text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_expense_id UUID; v_count INT; v_total_cents BIGINT; v_base_cents BIGINT; v_remainder_cents BIGINT; i INT; v_split_amount NUMERIC(10,2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = p_trip_id AND user_id = auth.uid() AND status = 'active') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  INSERT INTO expenses (trip_id, description, amount, currency, payer_id, experience_id) VALUES (p_trip_id, p_description, p_amount, p_currency, p_payer_id, p_experience_id) RETURNING id INTO v_expense_id;
  v_count := array_length(p_participant_ids, 1); v_total_cents := ROUND(p_amount * 100)::BIGINT; v_base_cents := v_total_cents / v_count; v_remainder_cents := v_total_cents % v_count;
  FOR i IN 1..v_count LOOP v_split_amount := (v_base_cents + CASE WHEN i = 1 THEN v_remainder_cents ELSE 0 END)::NUMERIC / 100; INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (v_expense_id, p_participant_ids[i], v_split_amount); END LOOP;
  RETURN v_expense_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.update_expense_with_splits(p_expense_id uuid, p_description text, p_amount numeric, p_payer_id uuid, p_experience_id uuid, p_participant_ids uuid[])
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_trip_id UUID; v_count INT; v_total_cents BIGINT; v_base_cents BIGINT; v_remainder_cents BIGINT; i INT; v_split_amount NUMERIC(10,2); v_stale BOOLEAN := FALSE;
BEGIN
  SELECT trip_id INTO v_trip_id FROM expenses WHERE id = p_expense_id;
  IF NOT EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = v_trip_id AND user_id = auth.uid() AND status = 'active') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF NOT EXISTS (SELECT 1 FROM expenses WHERE id = p_expense_id AND payer_id = auth.uid()) THEN RAISE EXCEPTION 'only_payer_can_edit'; END IF;
  UPDATE expenses SET description = p_description, amount = p_amount, payer_id = p_payer_id, experience_id = p_experience_id WHERE id = p_expense_id;
  DELETE FROM expense_splits WHERE expense_id = p_expense_id;
  v_count := array_length(p_participant_ids, 1); v_total_cents := ROUND(p_amount * 100)::BIGINT; v_base_cents := v_total_cents / v_count; v_remainder_cents := v_total_cents % v_count;
  FOR i IN 1..v_count LOOP v_split_amount := (v_base_cents + CASE WHEN i = 1 THEN v_remainder_cents ELSE 0 END)::NUMERIC / 100; INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (p_expense_id, p_participant_ids[i], v_split_amount); END LOOP;
  SELECT EXISTS (SELECT 1 FROM (SELECT ts_u.from_user_id, COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.trip_id = v_trip_id AND e.payer_id = ts_u.from_user_id), 0) - COALESCE((SELECT SUM(es.amount) FROM expense_splits es JOIN expenses e ON e.id = es.expense_id WHERE e.trip_id = v_trip_id AND es.user_id = ts_u.from_user_id), 0) + COALESCE((SELECT SUM(s.amount) FROM trip_settlements s WHERE s.trip_id = v_trip_id AND s.from_user_id = ts_u.from_user_id), 0) - COALESCE((SELECT SUM(s.amount) FROM trip_settlements s WHERE s.trip_id = v_trip_id AND s.to_user_id = ts_u.from_user_id), 0) AS net_balance FROM (SELECT DISTINCT from_user_id FROM trip_settlements WHERE trip_id = v_trip_id) ts_u) balances WHERE net_balance > 0.005) INTO v_stale;
  IF v_stale THEN DELETE FROM trip_settlements WHERE trip_id = v_trip_id; END IF;
END; $function$;

CREATE OR REPLACE FUNCTION public.settle_debt_safe(p_trip_id uuid, p_from_user_id uuid, p_to_user_id uuid, p_amount numeric, p_settled_by uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_paid NUMERIC; v_owes NUMERIC; v_sent NUMERIC; v_received NUMERIC; v_balance NUMERIC;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_trip_id::text || p_from_user_id::text || p_to_user_id::text)::bigint);
  IF NOT EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = p_trip_id AND user_id = auth.uid() AND status = 'active') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF NOT EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = p_trip_id AND user_id = p_from_user_id AND status = 'active') THEN RAISE EXCEPTION 'from_user_not_member'; END IF;
  IF NOT EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = p_trip_id AND user_id = p_to_user_id AND status = 'active') THEN RAISE EXCEPTION 'to_user_not_member'; END IF;
  IF auth.uid() != p_from_user_id AND auth.uid() != p_to_user_id THEN RAISE EXCEPTION 'not_involved'; END IF;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM expenses WHERE trip_id = p_trip_id AND payer_id = p_from_user_id;
  SELECT COALESCE(SUM(es.amount), 0) INTO v_owes FROM expense_splits es JOIN expenses e ON e.id = es.expense_id WHERE e.trip_id = p_trip_id AND es.user_id = p_from_user_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_sent FROM trip_settlements WHERE trip_id = p_trip_id AND from_user_id = p_from_user_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_received FROM trip_settlements WHERE trip_id = p_trip_id AND to_user_id = p_from_user_id;
  v_balance := (v_paid - v_owes) + v_sent - v_received;
  IF v_balance + p_amount > 0.005 THEN RAISE EXCEPTION 'already_settled'; END IF;
  INSERT INTO trip_settlements (trip_id, from_user_id, to_user_id, amount, settled_by) VALUES (p_trip_id, p_from_user_id, p_to_user_id, p_amount, p_settled_by);
END; $function$;

-- Drop ambiguous overload (no p_currency) — same PGRST203 ambiguity bug as
-- delete_expense_safe had. useCreateExpense always passes p_currency.
DROP FUNCTION IF EXISTS public.create_expense_with_splits(uuid, text, numeric, uuid, uuid, uuid[]);
