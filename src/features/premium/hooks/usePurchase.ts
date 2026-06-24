import { useMutation, useQueryClient } from '@tanstack/react-query'
import Purchases, { PurchasesErrorCode } from 'react-native-purchases'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { queryKeys } from '@lib/queryKeys'
import { useErrorToast } from '@lib/errorToast'
type PlanId = 'monthly' | 'annual' | 'lifetime'

interface PurchaseVars {
  planId: PlanId
  onClose?: () => void
}

function computeOptimisticExpiry(planId: PlanId): string | null {
  if (planId === 'lifetime') return null
  const now = new Date()
  now.setDate(now.getDate() + (planId === 'annual' ? 366 : 31))
  return now.toISOString()
}

export function usePurchase() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const showError = useErrorToast()

  return useMutation({
    mutationFn: async ({ planId }: PurchaseVars) => {
      const offerings = await Purchases.getOfferings()
      const current = offerings.current
      if (!current) throw new Error('No offerings available')

      const pkg =
        planId === 'monthly'
          ? current.monthly
          : planId === 'annual'
          ? current.annual
          : current.lifetime

      if (!pkg) throw new Error(`Package not found: ${planId}`)

      const { customerInfo } = await Purchases.purchasePackage(pkg)
      return customerInfo
    },
    onSuccess: (_customerInfo, { planId, onClose }) => {
      if (!user?.id) return

      // Optimistic update — RC webhook will confirm within seconds
      queryClient.setQueryData(
        queryKeys.auth.profile(user.id),
        (old: any) => old ? { ...old, is_pro: true, pro_expires_at: computeOptimisticExpiry(planId) } : old
      )

      // Re-fetch after 3s to get authoritative data from webhook
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(user.id) })
      }, 3000)

      onClose?.()
    },
    onError: (error: any) => {
      if (error?.code === PurchasesErrorCode.PurchaseCancelledError) return
      showError(error?.message ?? 'Error al procesar la compra')
    },
  })
}
