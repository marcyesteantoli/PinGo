-- trip_collaborators had no DELETE policy, so "leave/delete trip" (which removes
-- the caller's own collaborator row) silently failed and the trip reappeared
-- after refetch.

create policy "trip_collaborators_delete"
on public.trip_collaborators
for delete
to authenticated
using (user_id = auth.uid());
