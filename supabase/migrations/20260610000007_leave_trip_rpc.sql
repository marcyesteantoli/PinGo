-- "Leave trip" replaces hard-deleting the caller's trip_collaborators row.
-- Branches: last active member -> delete trip entirely (cascade); owner with
-- other active members -> transfer ownership to oldest active (joined_at ASC),
-- then mark caller 'left'; plain member -> mark caller 'left'.

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

-- join_trip_by_code: reactivate a 'left' row instead of erroring/duplicating PK.
CREATE OR REPLACE FUNCTION public.join_trip_by_code(p_join_code text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_trip_id uuid;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE join_code = UPPER(p_join_code);
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid join code'; END IF;

  IF EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = v_trip_id AND user_id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  IF EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_id = v_trip_id AND user_id = auth.uid() AND status = 'left') THEN
    UPDATE trip_collaborators SET status = 'active', joined_at = now()
      WHERE trip_id = v_trip_id AND user_id = auth.uid();
  ELSE
    INSERT INTO trip_collaborators (trip_id, user_id, role, status, joined_at)
      VALUES (v_trip_id, auth.uid(), 'member', 'active', now());
  END IF;

  RETURN v_trip_id;
END; $function$;
