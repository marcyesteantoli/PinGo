import { Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Purchases from 'react-native-purchases'
import { isEntitled } from '@lib/revenuecat'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { queryKeys } from '@lib/queryKeys'
import { useTranslation } from 'react-i18next'

export function useRestorePurchases() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async () => {
      const customerInfo = await Purchases.restorePurchases()
      return { customerInfo, wasEntitled: isEntitled(customerInfo) }
    },
    onSuccess: ({ wasEntitled }) => {
      if (wasEntitled && user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(user.id) })
        Alert.alert(
          t('premium_restore_success_title'),
          t('premium_restore_success_message'),
        )
      } else {
        Alert.alert(
          t('premium_restore_empty_title'),
          t('premium_restore_empty_message'),
        )
      }
    },
    onError: () => {
      Alert.alert(t('common_error'), t('premium_restore_error_message'))
    },
  })
}
