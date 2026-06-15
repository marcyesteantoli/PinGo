-- Allow standalone saved experiences (not tied to any trip).
-- experiences.trip_id becomes nullable; RLS extended to cover
-- "trip_id IS NULL AND created_by = auth.uid()" rows.

ALTER TABLE experiences ALTER COLUMN trip_id DROP NOT NULL;

-- ============================================================
-- experiences RLS — allow standalone rows owned by the creator
-- ============================================================
DROP POLICY IF EXISTS "experiences_select" ON experiences;
CREATE POLICY "experiences_select" ON experiences
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
    OR (trip_id IS NULL AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "experiences_insert" ON experiences;
CREATE POLICY "experiences_insert" ON experiences
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
    OR (trip_id IS NULL AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "experiences_update" ON experiences;
CREATE POLICY "experiences_update" ON experiences
  FOR UPDATE TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
    OR (trip_id IS NULL AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "experiences_delete" ON experiences;
CREATE POLICY "experiences_delete" ON experiences
  FOR DELETE TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND status = 'active')
    OR (trip_id IS NULL AND created_by = auth.uid())
  );

-- ============================================================
-- RPC: create a standalone experience + save it in one call
-- ============================================================
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
  INSERT INTO experiences (trip_id, type, title, location, created_by)
  VALUES (NULL, p_type, p_title, p_location, auth.uid())
  RETURNING id INTO v_experience_id;

  INSERT INTO user_saved_experiences (user_id, experience_id, note, price_paid)
  VALUES (auth.uid(), v_experience_id, p_note, p_price_paid);

  RETURN v_experience_id;
END;
$$;

-- ============================================================
-- Cleanup: drop standalone experience when its last save is removed
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_standalone_experience()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM experiences e
  WHERE e.id = OLD.experience_id
    AND e.trip_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_saved_experiences s WHERE s.experience_id = OLD.experience_id
    );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_standalone_experience ON user_saved_experiences;
CREATE TRIGGER trg_cleanup_standalone_experience
  AFTER DELETE ON user_saved_experiences
  FOR EACH ROW EXECUTE FUNCTION cleanup_standalone_experience();
