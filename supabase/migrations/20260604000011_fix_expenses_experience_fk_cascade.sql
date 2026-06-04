ALTER TABLE expenses
  DROP CONSTRAINT expenses_experience_id_fkey,
  ADD CONSTRAINT expenses_experience_id_fkey
    FOREIGN KEY (experience_id)
    REFERENCES experiences(id)
    ON DELETE SET NULL;
