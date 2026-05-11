import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar } from '@components/ui/Avatar'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { EmptyState } from '@components/ui/EmptyState'
import { Input } from '@components/ui/Input'
import { SkeletonCard } from '@components/ui/Skeleton'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useProfile } from '@features/auth/hooks/useProfile'
import { TripCard } from '@features/trips/components/TripCard'
import { useJoinTrip } from '@features/trips/hooks/useJoinTrip'
import { useTrips } from '@features/trips/hooks/useTrips'
import { joinTripSchema, type JoinTripFormData } from '@features/trips/types'

type Segment = 'upcoming' | 'past'

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'past',     label: 'Pasados'  },
]

export default function DashboardScreen() {
  const router = useRouter()
  const { data: trips, isLoading, error, refetch } = useTrips()
  const joinTrip = useJoinTrip()
  const { data: user } = useCurrentUser()
  const { data: profile } = useProfile(user?.id)
  const [joinSheetVisible, setJoinSheetVisible] = useState(false)
  const [segment, setSegment] = useState<Segment>('upcoming')

  const { control, handleSubmit, reset, formState: { errors } } = useForm<JoinTripFormData>({
    resolver: zodResolver(joinTripSchema),
  })

  const onJoinSubmit = async (data: JoinTripFormData) => {
    try {
      const tripId = await joinTrip.mutateAsync(data)
      setJoinSheetVisible(false)
      reset()
      router.push(`/(app)/trips/${tripId}/timeline`)
    } catch {
      // Error se muestra via joinTrip.error
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const upcomingTrips = trips?.filter(t => t.end_date >= today) ?? []
  const pastTrips    = trips?.filter(t => t.end_date <  today) ?? []
  const displayedTrips = segment === 'upcoming' ? upcomingTrips : pastTrips

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-surface-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50">Mis viajes</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/profile')}
          className="w-11 h-11 rounded-full overflow-hidden"
        >
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.name ?? user?.user_metadata?.name ?? 'U'}
            size="md"
          />
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <View className="mx-5 mb-4 flex-row bg-neutral-100 dark:bg-surface-700 rounded-[10px] p-1">
        {SEGMENTS.map(({ key, label }) => {
          const isActive = segment === key
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSegment(key)}
              activeOpacity={0.8}
              className={`flex-1 py-[7px] rounded-[8px] items-center ${
                isActive ? 'bg-white dark:bg-surface-600' : ''
              }`}
              style={isActive ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2,
                elevation: 2,
              } : undefined}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  isActive
                    ? 'text-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 mx-5 mb-4">
        <Button
          onPress={() => router.push('/(app)/trips/new')}
          className="flex-1"
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text className="text-white text-[17px] font-semibold ml-1.5">Crear viaje</Text>
        </Button>
        <Button
          onPress={() => setJoinSheetVisible(true)}
          variant="ghost"
          className="flex-1"
        >
          <Ionicons name="enter-outline" size={18} color="#4f56e8" />
          <Text className="text-neutral-700 dark:text-neutral-200 text-[17px] font-semibold ml-1.5">Unirse</Text>
        </Button>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View className="px-5 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-base text-error text-center mb-4">{error.message}</Text>
          <Button onPress={() => refetch()} variant="ghost">Reintentar</Button>
        </View>
      ) : (
        <FlatList
          data={displayedTrips}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 gap-3 pb-8"
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => router.push(`/(app)/trips/${item.id}/timeline`)}
            />
          )}
          ListEmptyComponent={
            segment === 'upcoming' ? (
              <EmptyState
                icon="airplane-outline"
                title="Sin viajes próximos"
                subtitle="Crea tu primer viaje o únete con un código"
              />
            ) : (
              <EmptyState
                icon="checkmark-circle-outline"
                title="Sin viajes pasados"
                subtitle="Aquí aparecerán los viajes que hayas completado"
              />
            )
          }
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {/* Join sheet */}
      <BottomSheet
        visible={joinSheetVisible}
        onClose={() => { setJoinSheetVisible(false); reset() }}
        title="Unirse a un viaje"
      >
        <View className="gap-4">
          <Controller
            control={control}
            name="join_code"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Código del viaje"
                placeholder="ABC123"
                value={value}
                onChangeText={(text) => onChange(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                error={errors.join_code?.message}
              />
            )}
          />
          {joinTrip.error && (
            <Text className="text-sm text-error text-center">{joinTrip.error.message}</Text>
          )}
          <Button onPress={handleSubmit(onJoinSubmit)} isLoading={joinTrip.isPending}>
            Unirse al viaje
          </Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}
