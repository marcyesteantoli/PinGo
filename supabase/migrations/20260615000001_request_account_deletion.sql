-- Account deletion, step 1 (immediate): leave every active trip (same rules as
-- leave_trip - transfer ownership or delete a solo trip), anonymize the profile,
-- and ban the auth user so it can no longer sign in. The auth.users row itself
-- is purged later by purge_deleted_accounts() once the grace period elapses.

CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_trip RECORD;
  v_other_active int;
  v_new_owner uuid;
BEGIN
  FOR v_trip IN
    SELECT trip_id, role FROM trip_collaborators
    WHERE user_id = auth.uid() AND status = 'active'
  LOOP
    SELECT count(*) INTO v_other_active FROM trip_collaborators
      WHERE trip_id = v_trip.trip_id AND status = 'active' AND user_id != auth.uid();

    IF v_trip.role = 'owner' AND v_other_active = 0 THEN
      DELETE FROM trips WHERE id = v_trip.trip_id;
      CONTINUE;
    END IF;

    IF v_trip.role = 'owner' THEN
      SELECT user_id INTO v_new_owner FROM trip_collaborators
        WHERE trip_id = v_trip.trip_id AND status = 'active' AND user_id != auth.uid()
        ORDER BY joined_at ASC LIMIT 1;
      UPDATE trip_collaborators SET role = 'owner'
        WHERE trip_id = v_trip.trip_id AND user_id = v_new_owner;
    END IF;

    UPDATE trip_collaborators SET status = 'left', role = 'member'
      WHERE trip_id = v_trip.trip_id AND user_id = auth.uid();
  END LOOP;

  UPDATE profiles
    SET name = '__deleted_user__', avatar_url = NULL, deleted_at = now()
    WHERE id = auth.uid();

  UPDATE auth.users SET banned_until = '2099-01-01' WHERE id = auth.uid();
END;
$function$;
