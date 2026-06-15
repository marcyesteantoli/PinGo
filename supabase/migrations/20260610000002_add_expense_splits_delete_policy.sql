-- expense_splits had RLS enabled but no DELETE policy. Deleting an expense cascades
-- to expense_splits, and that cascade is itself subject to RLS — without this policy
-- the whole expense delete was rejected (silent failure, UI rolled back optimistic update).

create policy "expense_splits_delete"
on public.expense_splits
for delete
to authenticated
using (
  expense_id in (
    select e.id
    from public.expenses e
    join public.trip_collaborators tc on tc.trip_id = e.trip_id
    where tc.user_id = auth.uid()
  )
);
