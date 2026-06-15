-- Backfill profiles for existing auth.users that have no profile yet
INSERT INTO public.profiles (id, name)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
