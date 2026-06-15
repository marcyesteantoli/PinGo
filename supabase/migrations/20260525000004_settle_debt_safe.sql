-- ============================================================
-- settle_debt_safe
-- Registra un settlement de forma atómica y segura.
--
-- Protecciones:
--   1. Advisory lock por (trip_id, from_user, to_user) →
--      serializa requests concurrentes del mismo par.
--   2. Recalcula el balance actual de from_user en BD →
--      rechaza si el settlement sobraría (race condition o
--      doble click).
--   3. Solo el deudor o acreedor pueden registrar.
-- ============================================================
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
  -- Serializa requests concurrentes para el mismo par deudor→acreedor
  PERFORM pg_advisory_xact_lock(
    hashtext(p_trip_id::text || p_from_user_id::text || p_to_user_id::text)::bigint
  );

  -- El llamador debe ser colaborador del viaje
  IF NOT EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Solo el deudor o el acreedor pueden registrar el pago
  IF auth.uid() != p_from_user_id AND auth.uid() != p_to_user_id THEN
    RAISE EXCEPTION 'not_involved';
  END IF;

  -- Recalcula el balance actual de from_user:
  --   balance = (total pagado como payer) - (total splits a cargo)
  --           + settlements ya enviados - settlements ya recibidos
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

  -- Guard: si este settlement dejaría a from_user con balance positivo
  -- (acreedor ficticio), la deuda ya estaba saldada → rechazar.
  IF v_balance + p_amount > 0.005 THEN
    RAISE EXCEPTION 'already_settled';
  END IF;

  INSERT INTO trip_settlements (trip_id, from_user_id, to_user_id, amount, settled_by)
  VALUES (p_trip_id, p_from_user_id, p_to_user_id, p_amount, p_settled_by);
END;
$$;
