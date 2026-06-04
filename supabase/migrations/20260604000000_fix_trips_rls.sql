-- Fix: trips_select had OR true, exposing all trips to any authenticated user.
-- join_trip_by_code RPC is SECURITY DEFINER and does not need an open SELECT policy.
DROP POLICY IF EXISTS "trips_select" ON trips;

CREATE POLICY "trips_select" ON trips
  FOR SELECT TO authenticated USING (
    id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );
