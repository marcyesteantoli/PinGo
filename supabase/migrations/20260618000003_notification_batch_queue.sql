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
