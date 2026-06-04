import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@lib/queryKeys'
import { SupabasePremiumService } from '../services/SupabasePremiumService'

const premiumService = new SupabasePremiumService()

/**
 * Returns true if ANY collaborator in the trip holds a trip_unlock or a Pro subscription.
 * When true, all collaborators (including free users) can upload up to the premium hard cap.
 */
export function useTripSharedPremium(tripId: string): { isTripPremium: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.premium.tripSharedUnlock(tripId),
    queryFn: () => premiumService.getTripSharedStatus(tripId),
    staleTime: 1000 * 60 * 5,
  })

  return { isTripPremium: data ?? false, isLoading }
}
