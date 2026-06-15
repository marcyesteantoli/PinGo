-- La columna is_settled en expense_splits nunca se lee ni escribe en el código.
-- El sistema de settlements usa la tabla trip_settlements.
-- Se elimina para evitar confusión futura.
ALTER TABLE expense_splits DROP COLUMN IF EXISTS is_settled;
