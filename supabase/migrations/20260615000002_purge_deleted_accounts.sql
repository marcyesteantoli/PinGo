-- Account deletion, step 2 (deferred): once a profile has been anonymized for
-- 30+ days, remove the auth.users row entirely. This cascades to profiles,
-- trip_collaborators, memories, wishlist_items and user_saved_experiences;
-- shared records keep their rows with attribution set to NULL (see
-- 20260615000000_account_deletion_fks.sql).

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.purge_deleted_accounts()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM auth.users
  WHERE id IN (
    SELECT id FROM profiles WHERE deleted_at < now() - interval '30 days'
  );
END;
$function$;

SELECT cron.schedule('purge-deleted-accounts', '0 3 * * *', 'SELECT public.purge_deleted_accounts()');
