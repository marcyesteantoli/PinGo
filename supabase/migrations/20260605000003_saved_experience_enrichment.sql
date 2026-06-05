-- Enrich user_saved_experiences with personal curation metadata.
-- All columns nullable / default — zero impact on existing rows.

ALTER TABLE public.user_saved_experiences
  ADD COLUMN IF NOT EXISTS tags TEXT[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS would_return  BOOLEAN  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_paid    INTEGER  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cover_photo_url TEXT   DEFAULT NULL;

COMMENT ON COLUMN public.user_saved_experiences.tags IS 'User-defined labels, e.g. ["date night","bucket list"]';
COMMENT ON COLUMN public.user_saved_experiences.would_return IS 'Would the user visit this again? NULL = no answer yet';
COMMENT ON COLUMN public.user_saved_experiences.price_paid IS 'Approximate amount spent (user-entered, local currency)';
COMMENT ON COLUMN public.user_saved_experiences.cover_photo_url IS 'User-selected photo override for the card background';
