import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE } from '@/dev/mockData'
import type { JoinTripFormData } from '../types'

export function useJoinTrip() {
  const queryClient = useQueryClient()

  return useMutation<string, Error, JoinTripFormData>({
    mutationFn: async ({ join_code }) => {
      if (DEV_MODE) throw new Error('Los códigos de invitación no están disponibles en modo demo')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id')
        .eq('join_code', join_code.toUpperCase())
        .single()

      if (tripError || !trip) throw new Error('Código de viaje no encontrado')

      const { data: existing } = await supabase
        .from('trip_collaborators')
        .select('user_id')
        .eq('trip_id', trip.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) throw new Error('Ya eres colaborador de este viaje')

      const { error: joinError } = await supabase
        .from('trip_collaborators')
        .insert({ trip_id: trip.id, user_id: user.id, role: 'member' })

      if (joinError) throw new Error(joinError.message)

      return trip.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() })
    },
  })
}
