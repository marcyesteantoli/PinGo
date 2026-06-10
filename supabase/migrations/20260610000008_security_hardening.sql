-- Security hardening: close direct REST writes that bypass safe RPCs,
-- pin search_path on SECURITY DEFINER/trigger functions, and tighten
-- EXECUTE grants on internal helper functions.

-- 1. expense_splits: amounts must only change via update_expense_with_splits
--    (recalculates all splits + invalidates stale settlements). Direct UPDATE
--    let a user zero out their own split or move it to another expense_id.
DROP POLICY IF EXISTS "expense_splits_update" ON public.expense_splits;

-- 2. trip_settlements: inserts must only happen via settle_debt_safe
--    (validates balance + advisory lock). Direct INSERT let any party
--    fabricate arbitrary settlement rows.
DROP POLICY IF EXISTS "involved_parties_can_insert_settlements" ON public.trip_settlements;

-- 5. Pin search_path on functions flagged by function_search_path_mutable.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.handle_updated_at() SET search_path = '';

-- 6. Revoke EXECUTE on internal helper functions not meant to be called
--    directly via PostgREST.
-- PUBLIC pseudo-role grants EXECUTE to every role (anon, authenticated
-- inherit it), so revoke from PUBLIC and re-grant only what's needed.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_trip_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_trip_member(uuid) TO authenticated;

-- 4. expenses_delete: only the payer can delete via direct REST, matching
--    delete_expense_safe's only_payer_can_delete rule (owner override removed).
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

CREATE POLICY "expenses_delete" ON public.expenses
  FOR DELETE TO authenticated
  USING (payer_id = auth.uid());
