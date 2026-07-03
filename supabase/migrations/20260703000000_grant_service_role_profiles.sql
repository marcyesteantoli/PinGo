-- service_role bypasses RLS but still needs base table grants (Postgres default).
-- Missing since profiles table creation; revenuecat-webhook update was failing with 42501.
GRANT SELECT, UPDATE ON public.profiles TO service_role;
