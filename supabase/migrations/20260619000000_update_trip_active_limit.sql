-- Lower free-plan active trips limit from 3 to 2.
CREATE OR REPLACE FUNCTION create_trip(
  p_title      TEXT,
  p_start_date DATE,
  p_end_date   DATE,
  p_currency   TEXT DEFAULT 'EUR'
)
RETURNS SETOF trips
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
  v_profile profiles;
  v_active_count INT;
BEGIN
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

  INSERT INTO trips (title, start_date, end_date, currency, created_by)
  VALUES (p_title, p_start_date, p_end_date, p_currency, auth.uid())
  RETURNING id INTO v_trip_id;

  INSERT INTO trip_collaborators (trip_id, user_id, role)
  VALUES (v_trip_id, auth.uid(), 'owner')
  ON CONFLICT (trip_id, user_id) DO UPDATE SET role = 'owner';

  RETURN QUERY SELECT * FROM trips WHERE id = v_trip_id;
END;
$$;
