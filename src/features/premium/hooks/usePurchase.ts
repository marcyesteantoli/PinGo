import { useMutation } from '@tanstack/react-query'
import Purchases, { PurchasesErrorCode } from 'react-native-purchases'
import { useErrorToast } from '@lib/errorToast'

type PlanId = 'monthly' | 'annual' | 'lifetime'

interface PurchaseVars {
  planId: PlanId
  onClose?: () => void
}

export function usePurchase() {
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
    onSuccess: (_customerInfo, { onClose }) => {
      // RC listener in useRevenueCatSetup handles cache invalidation
      onClose?.()
    },
    onError: (error: any) => {
      if (error?.code === PurchasesErrorCode.PurchaseCancelledError) return
      showError(error?.message ?? 'Error al procesar la compra')
    },
  })
}
