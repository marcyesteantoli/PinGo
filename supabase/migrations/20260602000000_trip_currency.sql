-- ============================================================
-- Añade campo currency a la tabla trips.
-- Actualiza create_expense_with_splits para aceptar currency.
-- ============================================================

ALTER TABLE trips ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';

-- --------------------------------------------------------
-- create_trip
-- Crea un viaje y añade al creador como owner.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION create_trip(
  p_title      TEXT,
  p_start_date DATE,
  p_end_date   DATE,
  p_currency   TEXT DEFAULT 'EUR'
)
RETURNS SETOF trips
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
BEGIN
  INSERT INTO trips (title, start_date, end_date, currency, created_by)
  VALUES (p_title, p_start_date, p_end_date, p_currency, auth.uid())
  RETURNING id INTO v_trip_id;

  INSERT INTO trip_collaborators (trip_id, user_id, role)
  VALUES (v_trip_id, auth.uid(), 'owner');

  RETURN QUERY SELECT * FROM trips WHERE id = v_trip_id;
END;
$$;

-- --------------------------------------------------------
-- create_expense_with_splits — actualizado para aceptar currency.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_trip_id         UUID,
  p_description     TEXT,
  p_amount          NUMERIC,
  p_payer_id        UUID,
  p_experience_id   UUID,
  p_participant_ids UUID[],
  p_currency        TEXT DEFAULT 'EUR'
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

  INSERT INTO expenses (trip_id, description, amount, currency, payer_id, experience_id)
  VALUES (p_trip_id, p_description, p_amount, p_currency, p_payer_id, p_experience_id)
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
