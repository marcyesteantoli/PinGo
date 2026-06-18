CREATE OR REPLACE FUNCTION create_standalone_saved_experience(
  p_title text,
  p_type text,
  p_location jsonb DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_price_paid integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_experience_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO experiences (trip_id, type, title, location, created_by)
  VALUES (NULL, p_type, p_title, p_location, auth.uid())
  RETURNING id INTO v_experience_id;

  INSERT INTO user_saved_experiences (user_id, experience_id, note, price_paid)
  VALUES (auth.uid(), v_experience_id, p_note, p_price_paid);

  RETURN v_experience_id;
END;
$$;

CREATE OR REPLACE FUNCTION save_experience_from_trip(p_source_experience_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_experience_id uuid;
  v_title text;
  v_type text;
  v_location jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT title, type, location INTO v_title, v_type, v_location
  FROM experiences WHERE id = p_source_experience_id;

  IF v_title IS NULL THEN
    RAISE EXCEPTION 'Source experience not found';
  END IF;

  INSERT INTO experiences (trip_id, type, title, location, created_by)
  VALUES (NULL, v_type, v_title, v_location, auth.uid())
  RETURNING id INTO v_experience_id;

  INSERT INTO user_saved_experiences (user_id, experience_id, source_experience_id)
  VALUES (auth.uid(), v_experience_id, p_source_experience_id);

  RETURN v_experience_id;
END;
$$;
