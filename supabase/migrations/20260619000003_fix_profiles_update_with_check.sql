DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND deleted_at IS NULL);
