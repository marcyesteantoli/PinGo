-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS: trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select" ON trips
  FOR SELECT TO authenticated USING (
    id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
    OR true -- permite buscar por join_code para unirse
  );

CREATE POLICY "trips_insert" ON trips
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "trips_update" ON trips
  FOR UPDATE TO authenticated USING (
    id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid() AND role = 'owner')
  );

-- RLS: trip_collaborators
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_collaborators_select" ON trip_collaborators
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "trip_collaborators_insert" ON trip_collaborators
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS: experiences
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "experiences_select" ON experiences
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "experiences_insert" ON experiences
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "experiences_update" ON experiences
  FOR UPDATE TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "experiences_delete" ON experiences
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- RLS: documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON documents
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_delete" ON documents
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- RLS: expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

-- RLS: expense_splits
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_splits_select" ON expense_splits
  FOR SELECT TO authenticated USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE tc.user_id = auth.uid()
    )
  );

CREATE POLICY "expense_splits_insert" ON expense_splits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "expense_splits_update" ON expense_splits
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- RLS: experience_ratings
ALTER TABLE experience_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select" ON experience_ratings
  FOR SELECT TO authenticated USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE tc.user_id = auth.uid()
    )
  );

CREATE POLICY "ratings_insert" ON experience_ratings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "ratings_update" ON experience_ratings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- RLS: memories
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memories_select" ON memories
  FOR SELECT TO authenticated USING (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "memories_insert" ON memories
  FOR INSERT TO authenticated WITH CHECK (
    trip_id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "memories_delete" ON memories
  FOR DELETE TO authenticated USING (user_id = auth.uid());
