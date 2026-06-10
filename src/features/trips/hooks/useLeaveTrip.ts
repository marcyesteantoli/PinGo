import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID, mockTrips, mockCollaborators } from '@/dev/mockData'

export function useLeaveTrip() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (tripId) => {
      if (DEV_MODE) {
        const collaborators = mockCollaborators[tripId] ?? []
        const me = collaborators.find((c) => c.user_id === DEMO_USER_ID && c.status === 'active')
        if (!me) return

        const otherActive = collaborators.filter((c) => c.user_id !== DEMO_USER_ID && c.status === 'active')

        if (me.role === 'owner' && otherActive.length === 0) {
          const idx = mockTrips.findIndex((t) => t.id === tripId)
          if (idx !== -1) mockTrips.splice(idx, 1)
          return
        }

        if (me.role === 'owner') {
          const oldest = [...otherActive].sort(
            (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
          )[0]
          oldest.role = 'owner'
        }

        me.status = 'left'
        me.role = 'member'
        return
      }

      const { error } = await supabase.rpc('leave_trip', { p_trip_id: tripId })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
    },
  })
}
