import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { unregisterPushToken } from '@features/notifications/pushToken'
import { logoutRevenueCat } from '@lib/revenuecat'
import { mapAuthError } from '@lib/errors'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await unregisterPushToken()
      await logoutRevenueCat()
      const { error } = await supabase.auth.signOut()
      if (error) throw mapAuthError(error)
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
