-- Account deletion support: when a profile is removed, references owned/created
-- by that user must not block the delete. Personal records (ratings, memories)
-- cascade away; shared records (experiences, expenses, documents, trips, settlements)
-- keep existing rows but lose attribution (SET NULL) so collaborators keep their data.

ALTER TABLE trips ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE trips DROP CONSTRAINT trips_created_by_fkey;
ALTER TABLE trips ADD CONSTRAINT trips_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE experiences ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE experiences DROP CONSTRAINT experiences_created_by_fkey;
ALTER TABLE experiences ADD CONSTRAINT experiences_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE documents ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE documents DROP CONSTRAINT documents_uploaded_by_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE expenses ALTER COLUMN payer_id DROP NOT NULL;
ALTER TABLE expenses DROP CONSTRAINT expenses_payer_id_fkey;
ALTER TABLE expenses ADD CONSTRAINT expenses_payer_id_fkey
  FOREIGN KEY (payer_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- user_id is part of the PK, so SET NULL is not possible; cascade the split row.
ALTER TABLE expense_splits DROP CONSTRAINT expense_splits_user_id_fkey;
ALTER TABLE expense_splits ADD CONSTRAINT expense_splits_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE trip_settlements ALTER COLUMN from_user_id DROP NOT NULL;
ALTER TABLE trip_settlements DROP CONSTRAINT trip_settlements_from_user_id_fkey;
ALTER TABLE trip_settlements ADD CONSTRAINT trip_settlements_from_user_id_fkey
  FOREIGN KEY (from_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE trip_settlements ALTER COLUMN to_user_id DROP NOT NULL;
ALTER TABLE trip_settlements DROP CONSTRAINT trip_settlements_to_user_id_fkey;
ALTER TABLE trip_settlements ADD CONSTRAINT trip_settlements_to_user_id_fkey
  FOREIGN KEY (to_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE trip_settlements DROP CONSTRAINT trip_settlements_settled_by_fkey;
ALTER TABLE trip_settlements ADD CONSTRAINT trip_settlements_settled_by_fkey
  FOREIGN KEY (settled_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE experience_ratings DROP CONSTRAINT experience_ratings_user_id_fkey;
ALTER TABLE experience_ratings ADD CONSTRAINT experience_ratings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE experience_attribute_ratings DROP CONSTRAINT experience_attribute_ratings_user_id_fkey;
ALTER TABLE experience_attribute_ratings ADD CONSTRAINT experience_attribute_ratings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE memories DROP CONSTRAINT memories_user_id_fkey;
ALTER TABLE memories ADD CONSTRAINT memories_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
