import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useProfile } from '@features/auth/hooks/useProfile'
import { supabase } from '@lib/supabase'

export function isProfilePro(profile?: { is_pro: boolean; pro_expires_at: string | null } | null): boolean {
  if (!profile?.is_pro) return false
  if (!profile.pro_expires_at) return true
  return new Date(profile.pro_expires_at) > new Date()
}

export async function fetchUserProStatus(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_pro, pro_expires_at')
    .eq('id', userId)
    .single()
  return isProfilePro(data)
}

export function useIsPro() {
  const { data: user } = useCurrentUser()
  const { data: profile, isLoading } = useProfile(user?.id)
  return { isPro: isProfilePro(profile), isLoading }
}
