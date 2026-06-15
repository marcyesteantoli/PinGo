import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error: rpcError } = await supabase.rpc('request_account_deletion')
      if (rpcError) throw new Error(rpcError.message)

      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw new Error(signOutError.message)
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
