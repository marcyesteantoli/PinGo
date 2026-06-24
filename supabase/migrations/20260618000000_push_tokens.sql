CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_select_own" ON push_tokens
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "push_tokens_insert_own" ON push_tokens
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_tokens_delete_own" ON push_tokens
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Service role can read all tokens for fan-out in Edge Functions
CREATE POLICY "push_tokens_service_read" ON push_tokens
  FOR SELECT TO service_role USING (true);
