-- Add nullable FK from experiences to destinations
ALTER TABLE experiences
  ADD COLUMN destination_id UUID REFERENCES trip_destinations(id) ON DELETE SET NULL;

CREATE INDEX idx_experiences_destination_id ON experiences(destination_id);

-- Backfill: assign existing experiences to their implicit destination (by date overlap)
UPDATE experiences e
SET destination_id = (
  SELECT d.id
  FROM trip_destinations d
  WHERE d.trip_id = e.trip_id
    AND e.date IS NOT NULL
    AND d.start_date <= e.date
    AND e.date <= d.end_date
  ORDER BY d.start_date
  LIMIT 1
);
