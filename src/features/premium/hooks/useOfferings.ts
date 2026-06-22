import { useQuery } from '@tanstack/react-query'
import Purchases from 'react-native-purchases'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'

async function fetchOfferings() {
  const configured = await Purchases.isConfigured()
  if (!configured) throw new Error('RevenueCat not configured')

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('RevenueCat timeout')), 8000)
  )
  return Promise.race([Purchases.getOfferings(), timeout])
}

export function useOfferings() {
  const { data: user } = useCurrentUser()

  return useQuery({
    queryKey: ['revenuecat', 'offerings'],
    queryFn: fetchOfferings,
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.id,
    retry: 3,
    retryDelay: 500,
  })
}
