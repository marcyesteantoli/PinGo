-- Allow any trip collaborator to delete experiences (not just creator)
DROP POLICY IF EXISTS "experiences_delete" ON experiences;

CREATE POLICY "experiences_delete" ON experiences
  FOR DELETE TO authenticated USING (
    trip_id IN (
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );
