-- Enforce free-plan active trips limit in join_trip_by_code (mirrors create_trip check).
CREATE OR REPLACE FUNCTION join_trip_by_code(p_join_code TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id     uuid;
  v_profile     profiles;
  v_active_count INT;
BEGIN
  SELECT id INTO v_trip_id
  FROM trips
  WHERE join_code = UPPER(p_join_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = v_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();

  IF NOT public.profile_is_pro(v_profile) THEN
    SELECT count(*) INTO v_active_count
    FROM trip_collaborators tc
    JOIN trips t ON t.id = tc.trip_id
    WHERE tc.user_id = auth.uid()
      AND tc.status = 'active'
      AND t.end_date >= CURRENT_DATE;

    IF v_active_count >= 2 THEN
      RAISE EXCEPTION 'active_trip_limit_reached';
    END IF;
  END IF;

  INSERT INTO trip_collaborators (trip_id, user_id, role)
  VALUES (v_trip_id, auth.uid(), 'member');

  RETURN v_trip_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION join_trip_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_trip_by_code(TEXT) TO authenticated;
