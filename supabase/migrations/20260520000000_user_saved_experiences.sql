CREATE TABLE user_saved_experiences (
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, experience_id)
);

ALTER TABLE user_saved_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved experiences"
  ON user_saved_experiences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
