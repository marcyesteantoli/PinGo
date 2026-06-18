import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { unregisterPushToken } from '@features/notifications/pushToken'
import { logoutRevenueCat } from '@lib/revenuecat'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await unregisterPushToken()
      await logoutRevenueCat()
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
