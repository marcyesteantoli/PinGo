CREATE TABLE trip_settlements (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  from_user_id  UUID NOT NULL REFERENCES profiles(id),
  to_user_id    UUID NOT NULL REFERENCES profiles(id),
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  settled_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_trip_settlements_trip_id ON trip_settlements(trip_id);

ALTER TABLE trip_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_collaborators_can_view_settlements"
  ON trip_settlements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trip_collaborators tc
    WHERE tc.trip_id = trip_settlements.trip_id
      AND tc.user_id = auth.uid()
  ));

-- Solo el deudor o el acreedor pueden registrar un settlement
CREATE POLICY "involved_parties_can_insert_settlements"
  ON trip_settlements FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );
