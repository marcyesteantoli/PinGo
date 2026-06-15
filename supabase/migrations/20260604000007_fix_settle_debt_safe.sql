-- Fix: settle_debt_safe did not validate that p_from_user_id and p_to_user_id
-- are members of the trip. Any authenticated trip member could inject settlements
-- with arbitrary user UUIDs as counterparties, corrupting financial history.

CREATE OR REPLACE FUNCTION settle_debt_safe(
  p_trip_id      UUID,
  p_from_user_id UUID,
  p_to_user_id   UUID,
  p_amount       NUMERIC,
  p_settled_by   UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid     NUMERIC;
  v_owes     NUMERIC;
  v_sent     NUMERIC;
  v_received NUMERIC;
  v_balance  NUMERIC;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtext(p_trip_id::text || p_from_user_id::text || p_to_user_id::text)::bigint
  );

  -- Caller must be a trip collaborator
  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Both parties must be trip collaborators
  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = p_trip_id AND user_id = p_from_user_id
  ) THEN
    RAISE EXCEPTION 'from_user_not_member';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = p_trip_id AND user_id = p_to_user_id
  ) THEN
    RAISE EXCEPTION 'to_user_not_member';
  END IF;

  -- Only the debtor or creditor can register the payment
  IF auth.uid() != p_from_user_id AND auth.uid() != p_to_user_id THEN
    RAISE EXCEPTION 'not_involved';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM expenses
  WHERE trip_id = p_trip_id AND payer_id = p_from_user_id;

  SELECT COALESCE(SUM(es.amount), 0) INTO v_owes
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  WHERE e.trip_id = p_trip_id AND es.user_id = p_from_user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_sent
  FROM trip_settlements
  WHERE trip_id = p_trip_id AND from_user_id = p_from_user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_received
  FROM trip_settlements
  WHERE trip_id = p_trip_id AND to_user_id = p_from_user_id;

  v_balance := (v_paid - v_owes) + v_sent - v_received;

  IF v_balance + p_amount > 0.005 THEN
    RAISE EXCEPTION 'already_settled';
  END IF;

  INSERT INTO trip_settlements (trip_id, from_user_id, to_user_id, amount, settled_by)
  VALUES (p_trip_id, p_from_user_id, p_to_user_id, p_amount, p_settled_by);
END;
$$;
