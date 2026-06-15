import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useProfile } from '@features/auth/hooks/useProfile'

export function isProfilePro(profile?: { is_pro: boolean; pro_expires_at: string | null } | null): boolean {
  if (!profile?.is_pro) return false
  if (!profile.pro_expires_at) return true
  return new Date(profile.pro_expires_at) > new Date()
}

export function useIsPro() {
  const { data: user } = useCurrentUser()
  const { data: profile, isLoading } = useProfile(user?.id)
  return { isPro: isProfilePro(profile), isLoading }
}
