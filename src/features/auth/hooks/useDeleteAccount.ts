import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { mapAuthError, mapSupabaseError } from '@lib/errors'

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error: rpcError } = await supabase.rpc('request_account_deletion')
      if (rpcError) throw mapSupabaseError(rpcError)

      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw mapAuthError(signOutError)
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
