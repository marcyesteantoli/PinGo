import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { usePremium } from './usePremium'
import { SupabasePremiumService } from '../services/SupabasePremiumService'

const premiumService = new SupabasePremiumService()

export function useTripPremium(tripId: string): { isPremium: boolean; isLoading: boolean } {
  const { isPremium: isGlobalPremium, isLoading: isGlobalLoading } = usePremium()
  const { data: user } = useCurrentUser()

  const { data: isUnlocked, isLoading: isUnlockLoading } = useQuery({
    queryKey: queryKeys.premium.tripUnlock(tripId),
    queryFn: () => premiumService.getTripUnlockStatus(user!.id, tripId),
    enabled: !!user?.id && !isGlobalPremium,
    staleTime: 1000 * 60 * 5,
  })

  return {
    isPremium: isGlobalPremium || (isUnlocked ?? false),
    isLoading: isGlobalLoading || isUnlockLoading,
  }
}
