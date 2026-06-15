-- ============================================================
-- Smart settlement clearing after expense mutations.
--
-- Replaces the manual p_also_clear_settlements approach.
-- After any expense mutation, if any from_user in existing
-- settlements would have net_balance > 0.005 (overpaid), all
-- trip settlements are cleared atomically in the same txn.
--
-- Logic mirrors calculateBalances on the client:
--   net = (paid_as_payer - owed_as_participant)
--         + sent_settlements - received_settlements
-- If net > 0 for any debtor → they overpaid → stale settlements.
-- ============================================================


-- --------------------------------------------------------
-- update_expense_with_splits  (replaces previous version)
-- Atomically updates expense + splits, then auto-clears
-- settlements if any from_user is now overpaid.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION update_expense_with_splits(
  p_expense_id      UUID,
  p_description     TEXT,
  p_amount          NUMERIC,
  p_payer_id        UUID,
  p_experience_id   UUID,
  p_participant_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id         UUID;
  v_count           INT;
  v_total_cents     BIGINT;
  v_base_cents      BIGINT;
  v_remainder_cents BIGINT;
  i                 INT;
  v_split_amount    NUMERIC(10,2);
  v_stale           BOOLEAN := FALSE;
BEGIN
  SELECT trip_id INTO v_trip_id FROM expenses WHERE id = p_expense_id;

  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = v_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM expenses WHERE id = p_expense_id AND payer_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'only_payer_can_edit';
  END IF;

  UPDATE expenses
  SET description   = p_description,
      amount        = p_amount,
      payer_id      = p_payer_id,
      experience_id = p_experience_id
  WHERE id = p_expense_id;

  DELETE FROM expense_splits WHERE expense_id = p_expense_id;

  v_count           := array_length(p_participant_ids, 1);
  v_total_cents     := ROUND(p_amount * 100)::BIGINT;
  v_base_cents      := v_total_cents / v_count;
  v_remainder_cents := v_total_cents % v_count;

  FOR i IN 1..v_count LOOP
    v_split_amount := (v_base_cents + CASE WHEN i = 1 THEN v_remainder_cents ELSE 0 END)::NUMERIC / 100;
    INSERT INTO expense_splits (expense_id, user_id, amount)
    VALUES (p_expense_id, p_participant_ids[i], v_split_amount);
  END LOOP;

  -- Check if any settlement from_user is now overpaid (post-update data).
  -- net = (paid - owes) + sent_settlements - received_settlements
  -- If net > 0.005 the debtor overpaid → settlements are stale.
  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT
        ts_u.from_user_id,
        COALESCE((
          SELECT SUM(e.amount) FROM expenses e
          WHERE e.trip_id = v_trip_id AND e.payer_id = ts_u.from_user_id
        ), 0)
        - COALESCE((
          SELECT SUM(es.amount) FROM expense_splits es
          JOIN expenses e ON e.id = es.expense_id
          WHERE e.trip_id = v_trip_id AND es.user_id = ts_u.from_user_id
        ), 0)
        + COALESCE((
          SELECT SUM(s.amount) FROM trip_settlements s
          WHERE s.trip_id = v_trip_id AND s.from_user_id = ts_u.from_user_id
        ), 0)
        - COALESCE((
          SELECT SUM(s.amount) FROM trip_settlements s
          WHERE s.trip_id = v_trip_id AND s.to_user_id = ts_u.from_user_id
        ), 0) AS net_balance
      FROM (
        SELECT DISTINCT from_user_id
        FROM trip_settlements
        WHERE trip_id = v_trip_id
      ) ts_u
    ) balances
    WHERE net_balance > 0.005
  ) INTO v_stale;

  IF v_stale THEN
    DELETE FROM trip_settlements WHERE trip_id = v_trip_id;
  END IF;
END;
$$;


-- --------------------------------------------------------
-- delete_expense_safe  (replaces previous version)
-- Removes p_also_clear_settlements parameter.
-- Simulates post-deletion state to decide whether settlements
-- need clearing before actually deleting the expense.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_expense_safe(p_expense_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id  UUID;
  v_payer_id UUID;
  v_stale    BOOLEAN := FALSE;
BEGIN
  SELECT trip_id, payer_id INTO v_trip_id, v_payer_id
  FROM expenses WHERE id = p_expense_id;

  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = v_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_payer_id != auth.uid() THEN
    RAISE EXCEPTION 'only_payer_can_delete';
  END IF;

  -- Simulate post-deletion balance by excluding p_expense_id from
  -- both paid and owes calculations (AND e.id != p_expense_id).
  -- This runs BEFORE the actual DELETE so both tables are still intact.
  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT
        ts_u.from_user_id,
        COALESCE((
          SELECT SUM(e.amount) FROM expenses e
          WHERE e.trip_id = v_trip_id
            AND e.payer_id = ts_u.from_user_id
            AND e.id != p_expense_id
        ), 0)
        - COALESCE((
          SELECT SUM(es.amount) FROM expense_splits es
          JOIN expenses e ON e.id = es.expense_id
          WHERE e.trip_id = v_trip_id
            AND es.user_id = ts_u.from_user_id
            AND e.id != p_expense_id
        ), 0)
        + COALESCE((
          SELECT SUM(s.amount) FROM trip_settlements s
          WHERE s.trip_id = v_trip_id AND s.from_user_id = ts_u.from_user_id
        ), 0)
        - COALESCE((
          SELECT SUM(s.amount) FROM trip_settlements s
          WHERE s.trip_id = v_trip_id AND s.to_user_id = ts_u.from_user_id
        ), 0) AS net_balance
      FROM (
        SELECT DISTINCT from_user_id
        FROM trip_settlements
        WHERE trip_id = v_trip_id
      ) ts_u
    ) balances
    WHERE net_balance > 0.005
  ) INTO v_stale;

  IF v_stale THEN
    DELETE FROM trip_settlements WHERE trip_id = v_trip_id;
  END IF;

  -- CASCADE on expense_splits eliminates splits automatically.
  DELETE FROM expenses WHERE id = p_expense_id;
END;
$$;
