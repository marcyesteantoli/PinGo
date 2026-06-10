-- 20260525000005 did `CREATE OR REPLACE FUNCTION delete_expense_safe(p_expense_id UUID)`,
-- intending to replace the older delete_expense_safe(uuid, boolean DEFAULT false) from
-- 20260525000001. Different signatures mean Postgres created a second overload instead
-- of replacing it. PostgREST then can't disambiguate
-- `rpc('delete_expense_safe', { p_expense_id })` between the two candidates and errors,
-- causing the optimistic delete to roll back. Drop the stale overload.

drop function if exists public.delete_expense_safe(uuid, boolean);
