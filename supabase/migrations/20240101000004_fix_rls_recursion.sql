-- Fix: infinite recursion in trip_collaborators_select policy
-- The original policy queries trip_collaborators within itself, causing infinite recursion.
-- Solution: SECURITY DEFINER function bypasses RLS when checking membership.

CREATE OR REPLACE FUNCTION public.is_trip_member(check_trip_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = check_trip_id AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "trip_collaborators_select" ON trip_collaborators;

CREATE POLICY "trip_collaborators_select" ON trip_collaborators
  FOR SELECT TO authenticated USING (
    public.is_trip_member(trip_id)
  );
