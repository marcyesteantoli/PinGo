-- Fix: create_expense_with_splits accepted p_payer_id without validating it is
-- a trip collaborator, allowing any member to forge another user as payer.
-- Now validates both auth.uid() and p_payer_id are collaborators in the trip.
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_trip_id         UUID,
  p_description     TEXT,
  p_amount          NUMERIC,
  p_payer_id        UUID,
  p_experience_id   UUID,
  p_participant_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense_id      UUID;
  v_count           INT;
  v_total_cents     BIGINT;
  v_base_cents      BIGINT;
  v_remainder_cents BIGINT;
  i                 INT;
  v_split_amount    NUMERIC(10,2);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = p_trip_id AND user_id = p_payer_id
  ) THEN
    RAISE EXCEPTION 'payer_not_in_trip';
  END IF;

  INSERT INTO expenses (trip_id, description, amount, payer_id, experience_id)
  VALUES (p_trip_id, p_description, p_amount, p_payer_id, p_experience_id)
  RETURNING id INTO v_expense_id;

  v_count           := array_length(p_participant_ids, 1);
  v_total_cents     := ROUND(p_amount * 100)::BIGINT;
  v_base_cents      := v_total_cents / v_count;
  v_remainder_cents := v_total_cents % v_count;

  FOR i IN 1..v_count LOOP
    v_split_amount := (v_base_cents + CASE WHEN i = 1 THEN v_remainder_cents ELSE 0 END)::NUMERIC / 100;
    INSERT INTO expense_splits (expense_id, user_id, amount)
    VALUES (v_expense_id, p_participant_ids[i], v_split_amount);
  END LOOP;

  RETURN v_expense_id;
END;
$$;
