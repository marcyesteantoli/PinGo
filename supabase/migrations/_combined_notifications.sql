-- ===== 20260618000000_push_tokens.sql =====
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


-- ===== 20260618000001_notification_log.sql =====
-- Audit log + deduplication. Prevents double-sends on client retry.
-- UNIQUE (event_type, source_id, recipient_id): same event on same row → skip.
-- NULL source_id rows never conflict (PostgreSQL NULL semantics) — acceptable for rare events.
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source_id UUID,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  UNIQUE (event_type, source_id, recipient_id)
);

CREATE INDEX idx_notification_log_recipient ON notification_log(recipient_id);
CREATE INDEX idx_notification_log_trip ON notification_log(trip_id);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_log_service_only" ON notification_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== 20260618000002_notification_preferences.sql =====
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  expense_added BOOLEAN NOT NULL DEFAULT true,
  debt_settled BOOLEAN NOT NULL DEFAULT true,
  member_events BOOLEAN NOT NULL DEFAULT true,
  experience_added BOOLEAN NOT NULL DEFAULT false,
  memory_added BOOLEAN NOT NULL DEFAULT false,
  trip_reminders BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_prefs_own" ON notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_prefs_service_read" ON notification_preferences
  FOR SELECT TO service_role USING (true);


-- ===== 20260618000003_notification_batch_queue.sql =====
-- Batch queue for expense_added notifications.
-- One pending entry per (event_type, trip_id, actor_id, recipient_id).
-- The partial unique index enforces this — when status becomes 'sent',
-- a new entry can be created for future batches.
CREATE TABLE notification_batch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL DEFAULT 'expense_added',
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  count INT NOT NULL DEFAULT 1,
  last_description TEXT,
  trip_title TEXT,
  send_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Only one pending batch per actor→recipient pair per trip
CREATE UNIQUE INDEX uq_batch_pending
  ON notification_batch_queue (event_type, trip_id, actor_id, recipient_id)
  WHERE status = 'pending';

CREATE INDEX idx_batch_queue_send_at ON notification_batch_queue(send_at)
  WHERE status = 'pending';

ALTER TABLE notification_batch_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_queue_service_only" ON notification_batch_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Atomic upsert: inserts first batch entry or increments count on conflict.
-- Uses the partial index on (event_type, trip_id, actor_id, recipient_id) WHERE status='pending'.
CREATE OR REPLACE FUNCTION enqueue_expense_notification(
  p_trip_id UUID,
  p_actor_id UUID,
  p_recipient_id UUID,
  p_description TEXT,
  p_trip_title TEXT,
  p_send_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_batch_queue
    (event_type, trip_id, actor_id, recipient_id, count, last_description, trip_title, send_at, status)
  VALUES
    ('expense_added', p_trip_id, p_actor_id, p_recipient_id, 1, p_description, p_trip_title, p_send_at, 'pending')
  ON CONFLICT (event_type, trip_id, actor_id, recipient_id) WHERE status = 'pending' DO UPDATE SET
    count = notification_batch_queue.count + 1,
    last_description = EXCLUDED.last_description;
END;
$$;


-- ===== 20260618000004_profile_locale.sql =====
-- Store user's preferred locale for server-side notification copy.
-- Set by the client on sign-in and whenever the language changes.
ALTER TABLE profiles ADD COLUMN locale TEXT NOT NULL DEFAULT 'es';



