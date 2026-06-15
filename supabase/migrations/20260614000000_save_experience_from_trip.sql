-- Decouple saved experiences from trip experiences: saving from a trip now
-- creates an independent copy (trip_id IS NULL), reusing the standalone
-- saved-experience pattern. source_experience_id keeps a soft link back to
-- the trip experience for "saved from" provenance and isSaved lookups;
-- ON DELETE SET NULL so the copy survives if the original is later deleted.

ALTER TABLE user_saved_experiences
  ADD COLUMN source_experience_id uuid REFERENCES experiences(id) ON DELETE SET NULL;

CREATE INDEX idx_user_saved_experiences_source_experience_id
  ON user_saved_experiences(source_experience_id);

-- Prevent saving the same trip experience twice into separate copies.
CREATE UNIQUE INDEX idx_user_saved_experiences_unique_source
  ON user_saved_experiences(user_id, source_experience_id)
  WHERE source_experience_id IS NOT NULL;

-- ============================================================
-- RPC: copy a trip experience into an independent saved experience
-- ============================================================
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
