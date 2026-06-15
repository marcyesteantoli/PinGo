-- Remove tags and would_return from saved-experience curation metadata.
-- Both features were dropped from the product (redundant with personal note / unused).

ALTER TABLE public.user_saved_experiences
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS would_return;
