import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@lib/queryKeys'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { SupabasePremiumService } from '../services/SupabasePremiumService'
import type { PlanId } from '../services/PremiumService'

const premiumService = new SupabasePremiumService()

export function usePremiumActions() {
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const [isPurchasing, setIsPurchasing] = useState(false)

  const invalidateStatus = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.premium.status(user.id) })
    }
  }

  const purchase = async (planId: PlanId) => {
    setIsPurchasing(true)
    try {
      await premiumService.purchase(planId)
      invalidateStatus()
    } finally {
      setIsPurchasing(false)
    }
  }

  const purchaseTripUnlock = async (tripId: string) => {
    setIsPurchasing(true)
    try {
      await premiumService.purchaseTripUnlock(tripId)
      queryClient.invalidateQueries({ queryKey: queryKeys.premium.tripUnlock(tripId) })
    } finally {
      setIsPurchasing(false)
    }
  }

  const restore = async () => {
    setIsPurchasing(true)
    try {
      await premiumService.restore()
      invalidateStatus()
    } finally {
      setIsPurchasing(false)
    }
  }

  return { purchase, purchaseTripUnlock, restore, isPurchasing }
}
