-- Allow users to delete their own experience ratings
CREATE POLICY "ratings_delete" ON experience_ratings
  FOR DELETE TO authenticated USING (user_id = auth.uid());
