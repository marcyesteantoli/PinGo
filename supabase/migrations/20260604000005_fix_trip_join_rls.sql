-- Fix: trip_collaborators INSERT policy only checked user_id = auth.uid(),
-- allowing any authenticated user to self-join any trip without a join code.
-- Solution: block direct inserts; force all joins through SECURITY DEFINER RPC
-- that validates the join code before inserting.

-- 1. Block direct inserts on trip_collaborators
DROP POLICY IF EXISTS "trip_collaborators_insert" ON trip_collaborators;

CREATE POLICY "trip_collaborators_insert" ON trip_collaborators
  FOR INSERT TO authenticated WITH CHECK (false);

-- 2. Owner can still add collaborators directly (e.g. future invite by email)
--    via a separate policy scoped to owners only
CREATE POLICY "trip_collaborators_insert_owner" ON trip_collaborators
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (
      SELECT trip_id FROM trip_collaborators
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 3. Create join_trip_by_code RPC (SECURITY DEFINER bypasses RLS for the insert)
CREATE OR REPLACE FUNCTION join_trip_by_code(p_join_code TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id uuid;
BEGIN
  -- Validate join code
  SELECT id INTO v_trip_id
  FROM trips
  WHERE join_code = UPPER(p_join_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  -- Check already a member
  IF EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = v_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  INSERT INTO trip_collaborators (trip_id, user_id, role)
  VALUES (v_trip_id, auth.uid(), 'member');

  RETURN v_trip_id;
END;
$$;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION join_trip_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_trip_by_code(TEXT) TO authenticated;
