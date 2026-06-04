import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { SupabasePremiumService } from '../services/SupabasePremiumService'
import type { PremiumStatus } from '../services/PremiumService'

const premiumService = new SupabasePremiumService()

export function usePremium(): PremiumStatus {
  const { data: user } = useCurrentUser()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.premium.status(user?.id ?? ''),
    queryFn: () => premiumService.getStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  return {
    isPremium: data?.isPremium ?? false,
    plan: data?.plan ?? 'free',
    isLoading,
  }
}
