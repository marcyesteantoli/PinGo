-- saved-photos is a private per-user bucket (path {user_id}/...) for saved
-- experience cover photos: those objects are personal, not shared, so sweep
-- them before the user row disappears in purge_deleted_accounts().
CREATE OR REPLACE FUNCTION public.purge_deleted_accounts()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_user_ids
  FROM profiles WHERE deleted_at < now() - interval '30 days';

  IF v_user_ids IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM storage.objects
  WHERE bucket_id = 'saved-photos'
    AND (storage.foldername(name))[1] = ANY (SELECT id::text FROM unnest(v_user_ids) AS id);

  DELETE FROM auth.users WHERE id = ANY (v_user_ids);
END;
$function$;
