CREATE TABLE experience_attribute_ratings (
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id),
  attribute     TEXT NOT NULL,
  value         SMALLINT NOT NULL CHECK (value BETWEEN 1 AND 10),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (experience_id, user_id, attribute)
);

CREATE VIEW experience_attribute_ratings_avg AS
SELECT
  experience_id,
  attribute,
  ROUND(AVG(value)::NUMERIC, 1) AS avg,
  COUNT(*) AS rating_count
FROM experience_attribute_ratings
GROUP BY experience_id, attribute;

ALTER TABLE experience_attribute_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip members can view attribute ratings"
  ON experience_attribute_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiences e
      JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE e.id = experience_id AND tc.user_id = auth.uid()
    )
  );

CREATE POLICY "users can manage own attribute ratings"
  ON experience_attribute_ratings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
