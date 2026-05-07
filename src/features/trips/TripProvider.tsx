import { createContext, useContext, ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import type { Collaborator, Trip } from '@types/index'

type TripContextValue = {
  tripId: string
  trip: Trip
  collaborators: Collaborator[]
  currentUserRole: 'owner' | 'member'
  isOwner: boolean
  isLoading: boolean
  error: Error | null
}

const TripContext = createContext<TripContextValue | null>(null)

export function useTripContext() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTripContext must be used inside TripProvider')
  return ctx
}

export function TripProvider({ tripId, children }: { tripId: string; children: ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.collaborators.byTrip(tripId),
    queryFn: async () => {
      const [
        { data: trip },
        { data: collaborators },
        { data: { user } },
      ] = await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId).single(),
        supabase
          .from('trip_collaborators')
          .select('user_id, role, profiles(name, avatar_url)')
          .eq('trip_id', tripId),
        supabase.auth.getUser(),
      ])

      return { trip, collaborators, userId: user?.id ?? null }
    },
  })

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  if (!data?.trip) return null

  const collaborators: Collaborator[] =
    data.collaborators?.map((c: any) => ({
      user_id: c.user_id,
      name: c.profiles.name,
      avatar_url: c.profiles.avatar_url,
      role: c.role,
    })) ?? []

  const currentUserRole =
    collaborators.find((c) => c.user_id === data.userId)?.role ?? 'member'

  return (
    <TripContext.Provider
      value={{
        tripId,
        trip: data.trip,
        collaborators,
        currentUserRole,
        isOwner: currentUserRole === 'owner',
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </TripContext.Provider>
  )
}
