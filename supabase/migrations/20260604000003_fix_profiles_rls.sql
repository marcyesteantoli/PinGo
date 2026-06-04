-- Fix: profiles_select had USING (true), exposing all user profiles to any
-- authenticated user. Restrict to own profile plus co-travelers only.
DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM trip_collaborators
      WHERE trip_id IN (
        SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
      )
    )
  );
