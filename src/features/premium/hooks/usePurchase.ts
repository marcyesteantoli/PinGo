import { useMutation } from '@tanstack/react-query'
import Purchases, { PurchasesErrorCode } from 'react-native-purchases'
import { useTranslation } from 'react-i18next'
import { useErrorToast } from '@lib/errorToast'
import { AppError, getErrorMessage, toAppError } from '@lib/errors'

type PlanId = 'monthly' | 'annual' | 'lifetime'

interface PurchaseVars {
  planId: PlanId
  onClose?: () => void
}

export function usePurchase() {
  const showError = useErrorToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({ planId }: PurchaseVars) => {
      const offerings = await Purchases.getOfferings()
      const current = offerings.current
      if (!current) throw new AppError('purchase_failed')

      const pkg =
        planId === 'monthly'
          ? current.monthly
          : planId === 'annual'
          ? current.annual
          : current.lifetime

      if (!pkg) throw new AppError('purchase_failed')

      const { customerInfo } = await Purchases.purchasePackage(pkg)
      return customerInfo
    },
    onSuccess: (_customerInfo, { onClose }) => {
      // RC listener in useRevenueCatSetup handles cache invalidation
      onClose?.()
    },
    onError: (error: any) => {
      if (error?.code === PurchasesErrorCode.PurchaseCancelledError) return
      showError(getErrorMessage(toAppError(error, 'purchase_failed'), t))
    },
  })
}
