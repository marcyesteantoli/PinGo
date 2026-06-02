import { createContext, useContext, useEffect, ReactNode } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { queryKeys } from '@lib/queryKeys'
import { DEV_MODE, DEMO_USER_ID, mockTrips, mockCollaborators } from '@/dev/mockData'
import { Button } from '@components/ui/Button'
import { saveLastActiveTripId } from '@lib/lastActiveTrip'
import type { Collaborator, TripRole, Trip } from '@types/index'

type CollaboratorRow = {
  user_id: string
  role: TripRole
  profiles: { name: string; avatar_url: string | null } | null
}

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
  const { t } = useTranslation()
  useEffect(() => {
    saveLastActiveTripId(tripId)
  }, [tripId])

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.collaborators.byTrip(tripId),
    queryFn: async () => {
      if (DEV_MODE) {
        const trip = mockTrips.find((t) => t.id === tripId) ?? null
        const collaborators = mockCollaborators[tripId] ?? []
        return { trip, collaborators: collaborators.map((c) => ({ ...c, profiles: { name: c.name, avatar_url: c.avatar_url } })), userId: DEMO_USER_ID }
      }

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
  const router = useRouter()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100 dark:bg-surface-900">
        <ActivityIndicator size="large" color="#0046de" />
      </View>
    )
  }

  if (error || !data?.trip) {
    return (
      <View className="flex-1 items-center justify-center px-6 gap-4 bg-neutral-100 dark:bg-surface-900">
        <Text className="text-base text-neutral-600 dark:text-neutral-300 text-center">
          {error ? t('trips_error_title') : t('experience_notFound')}
        </Text>
        <Button onPress={() => router.back()} variant="ghost">
          {t('common_back')}
        </Button>
      </View>
    )
  }

  const collaborators: Collaborator[] =
    (data.collaborators as CollaboratorRow[] ?? []).map((c) => ({
      user_id: c.user_id,
      name: c.profiles?.name ?? '',
      avatar_url: c.profiles?.avatar_url ?? null,
      role: c.role,
    }))

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
