-- trips and expenses had RLS enabled but no DELETE policy, so deletes were silently denied.

-- Trip owner can delete the trip (collaborators/expenses/etc cascade).
create policy "trips_delete"
on public.trips
for delete
to authenticated
using (
  id in (
    select trip_collaborators.trip_id
    from public.trip_collaborators
    where trip_collaborators.user_id = auth.uid()
      and trip_collaborators.role = 'owner'
  )
);

-- Whoever paid the expense (creator) or the trip owner can delete it.
create policy "expenses_delete"
on public.expenses
for delete
to authenticated
using (
  payer_id = auth.uid()
  or trip_id in (
    select trip_collaborators.trip_id
    from public.trip_collaborators
    where trip_collaborators.user_id = auth.uid()
      and trip_collaborators.role = 'owner'
  )
);
