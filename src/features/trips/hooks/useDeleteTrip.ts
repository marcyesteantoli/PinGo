import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, mockTrips } from '@/dev/mockData'

export function useDeleteTrip() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (tripId) => {
      if (DEV_MODE) {
        const idx = mockTrips.findIndex(t => t.id === tripId)
        if (idx !== -1) mockTrips.splice(idx, 1)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { error } = await supabase
        .from('trip_collaborators')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
    },
  })
}
