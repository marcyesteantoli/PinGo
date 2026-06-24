import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Purchases from 'react-native-purchases'
import { initRevenueCat, logoutRevenueCat } from '@lib/revenuecat'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { queryKeys } from '@lib/queryKeys'

export function useRevenueCatSetup() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const userId = user?.id

  useEffect(() => {
    if (userId) {
      initRevenueCat(userId)
      queryClient.invalidateQueries({ queryKey: ['revenuecat', 'offerings'] })
    } else {
      logoutRevenueCat()
    }
  }, [userId, queryClient])

  useEffect(() => {
    if (!userId) return

    const listener = Purchases.addCustomerInfoUpdateListener(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(userId) })
    })

    return () => {
      listener.remove()
    }
  }, [userId, queryClient])
}
