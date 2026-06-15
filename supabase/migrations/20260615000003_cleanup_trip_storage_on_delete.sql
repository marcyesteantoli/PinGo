-- When the last active owner leaves a trip, leave_trip() drops the trips row
-- and DB cascade removes experiences/documents/memories rows. Storage objects
-- aren't covered by SQL cascade, so sweep memories/{trip_id}/* and
-- documents/{trip_id}/* before deleting the trip.

CREATE OR REPLACE FUNCTION public.leave_trip(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_other_active int;
  v_new_owner uuid;
BEGIN
  SELECT role INTO v_role FROM trip_collaborators
    WHERE trip_id = p_trip_id AND user_id = auth.uid() AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  SELECT count(*) INTO v_other_active FROM trip_collaborators
    WHERE trip_id = p_trip_id AND status = 'active' AND user_id != auth.uid();

  IF v_role = 'owner' AND v_other_active = 0 THEN
    DELETE FROM storage.objects
    WHERE bucket_id IN ('memories', 'documents')
      AND (storage.foldername(name))[2] = p_trip_id::text;

    DELETE FROM trips WHERE id = p_trip_id;
    RETURN;
  END IF;

  IF v_role = 'owner' THEN
    SELECT user_id INTO v_new_owner FROM trip_collaborators
      WHERE trip_id = p_trip_id AND status = 'active' AND user_id != auth.uid()
      ORDER BY joined_at ASC LIMIT 1;
    UPDATE trip_collaborators SET role = 'owner'
      WHERE trip_id = p_trip_id AND user_id = v_new_owner;
  END IF;

  UPDATE trip_collaborators SET status = 'left', role = 'member'
    WHERE trip_id = p_trip_id AND user_id = auth.uid();
END;
$function$;
