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
