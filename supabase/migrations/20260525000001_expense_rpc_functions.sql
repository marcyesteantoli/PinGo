-- ============================================================
-- Funciones RPC para operaciones atómicas sobre gastos.
-- SECURITY DEFINER: se ejecutan como owner (bypasa RLS).
-- Incluyen verificación explícita de autorización.
-- ============================================================

-- --------------------------------------------------------
-- create_expense_with_splits
-- Crea el gasto y sus splits en una sola transacción.
-- El reparto usa floor+remainder: la suma de splits = total exacto.
-- --------------------------------------------------------
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


-- --------------------------------------------------------
-- update_expense_with_splits
-- Actualiza gasto + reemplaza splits en una sola transacción.
-- Solo el pagador original puede editar.
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
END;
$$;


-- --------------------------------------------------------
-- delete_expense_safe
-- Borra el gasto (CASCADE elimina splits).
-- Solo el pagador puede borrar.
-- Si p_also_clear_settlements = true, borra también todos los
-- trip_settlements del viaje para mantener coherencia matemática.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_expense_safe(
  p_expense_id             UUID,
  p_also_clear_settlements BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id  UUID;
  v_payer_id UUID;
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

  IF p_also_clear_settlements THEN
    DELETE FROM trip_settlements WHERE trip_id = v_trip_id;
  END IF;

  -- CASCADE en expense_splits elimina los splits automáticamente
  DELETE FROM expenses WHERE id = p_expense_id;
END;
$$;
