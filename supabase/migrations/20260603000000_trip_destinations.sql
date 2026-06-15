CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE trip_destinations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  country     TEXT,
  lat         NUMERIC,
  lng         NUMERIC,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT trip_destinations_no_overlap EXCLUDE USING gist (
    trip_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
);

CREATE INDEX idx_trip_destinations_trip_id ON trip_destinations(trip_id);

ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_members_read_destinations"
  ON trip_destinations FOR SELECT
  USING (
    trip_id IN (
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "trip_members_write_destinations"
  ON trip_destinations FOR ALL
  USING (
    trip_id IN (
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );
