-- Fix: update_expense_with_splits accepted p_payer_id without validating it is
-- a trip collaborator. Mirrors the guard added to create_expense_with_splits
-- in migration 20260604000001.
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

  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = v_trip_id AND user_id = p_payer_id
  ) THEN
    RAISE EXCEPTION 'payer_not_in_trip';
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
