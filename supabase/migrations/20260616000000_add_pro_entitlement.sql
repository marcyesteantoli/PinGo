-- Pro entitlement fields on profiles. "pro" terminology (not "premium") per project convention.
ALTER TABLE profiles
  ADD COLUMN is_pro BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pro_expires_at TIMESTAMPTZ;

-- Effective Pro status accounts for expiry (NULL expiry = no-expiry Pro).
CREATE OR REPLACE FUNCTION public.profile_is_pro(p_profile profiles)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT p_profile.is_pro AND (p_profile.pro_expires_at IS NULL OR p_profile.pro_expires_at > now());
$$;
