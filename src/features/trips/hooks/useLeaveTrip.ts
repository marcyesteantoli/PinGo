import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'

async function cleanTripStorage(tripId: string) {
  for (const bucket of ['memories', 'documents'] as const) {
    const { data: files } = await supabase.storage.from(bucket).list(tripId)
    if (files && files.length > 0) {
      const paths = files.map((f) => `${tripId}/${f.name}`)
      await supabase.storage.from(bucket).remove(paths)
    }
  }
}

export function useLeaveTrip() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (tripId) => {
      const [{ data: collaborators }, { data: authData }] = await Promise.all([
        supabase
          .from('trip_collaborators')
          .select('user_id, role')
          .eq('trip_id', tripId)
          .eq('status', 'active'),
        supabase.auth.getUser(),
      ])

      const userId = authData.user?.id
      const me = collaborators?.find((c) => c.user_id === userId)
      const isSoleActiveOwner = me?.role === 'owner' && collaborators?.length === 1

      if (isSoleActiveOwner) {
        await cleanTripStorage(tripId).catch(() => {})
      }

      const { error } = await supabase.rpc('leave_trip', { p_trip_id: tripId })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
      supabase.functions.invoke('send-notification', {
        body: { event: 'member_left', trip_id: tripId, source_id: null, context: {} },
      }).catch(() => {})
    },
  })
}
