import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { isProfilePro } from './useIsPro'

export async function fetchTripProStatus(tripId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('trip_collaborators')
    .select('profiles(is_pro, pro_expires_at)')
    .eq('trip_id', tripId)
    .eq('status', 'active')

  if (error) throw new Error(error.message)

  return (data ?? []).some(row =>
    isProfilePro(row.profiles as { is_pro: boolean; pro_expires_at: string | null } | null)
  )
}

export function useTripProStatus(tripId: string) {
  return useQuery({
    queryKey: queryKeys.premium.tripStatus(tripId),
    queryFn: () => fetchTripProStatus(tripId),
    staleTime: 5 * 60 * 1000,
  })
}
