-- Fix duplicate key on trip_collaborators when a DB trigger already inserts the owner.
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
BEGIN
  INSERT INTO trips (title, start_date, end_date, currency, created_by)
  VALUES (p_title, p_start_date, p_end_date, p_currency, auth.uid())
  RETURNING id INTO v_trip_id;

  INSERT INTO trip_collaborators (trip_id, user_id, role)
  VALUES (v_trip_id, auth.uid(), 'owner')
  ON CONFLICT (trip_id, user_id) DO UPDATE SET role = 'owner';

  RETURN QUERY SELECT * FROM trips WHERE id = v_trip_id;
END;
$$;
