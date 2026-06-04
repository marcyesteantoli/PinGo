-- Fix: expense_splits_insert had WITH CHECK (true), allowing any authenticated
-- user to insert splits for any expense without trip membership validation.
DROP POLICY IF EXISTS "expense_splits_insert" ON expense_splits;

CREATE POLICY "expense_splits_insert" ON expense_splits
  FOR INSERT TO authenticated WITH CHECK (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN trip_collaborators tc ON tc.trip_id = e.trip_id
      WHERE tc.user_id = auth.uid()
    )
  );
