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
