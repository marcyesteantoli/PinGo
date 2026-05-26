import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader, useAppHeader } from '@components/ui/AppHeader'
import { ctaShadow } from '@lib/shadows'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { EmptyState } from '@components/ui/EmptyState'
import { Input } from '@components/ui/Input'
import { SkeletonCard } from '@components/ui/Skeleton'
import { TripCard } from '@features/trips/components/TripCard'
import { useJoinTrip } from '@features/trips/hooks/useJoinTrip'
import { useTrips } from '@features/trips/hooks/useTrips'
import { joinTripSchema, type JoinTripFormData } from '@features/trips/types'
import { useErrorToast } from '@lib/errorToast'

type Segment = 'upcoming' | 'past'

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'past',     label: 'Pasados'  },
]

export default function DashboardScreen() {
  const router = useRouter()
  const { data: trips, isLoading, error, refetch } = useTrips()
  const joinTrip = useJoinTrip()
  const showError = useErrorToast()
  const [joinSheetVisible, setJoinSheetVisible] = useState(false)
  const [segment, setSegment] = useState<Segment>('upcoming')

  useEffect(() => {
    if (joinTrip.error) showError(joinTrip.error.message)
  }, [joinTrip.error])
  const { scrollY, scrollHandler } = useAppHeader()

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
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader
        title="Mis viajes"
        scrollY={scrollY}
        rightActions={[
          { icon: 'add', onPress: () => router.push('/(app)/trips/new'), variant: 'primary' },
          { icon: 'enter-outline', onPress: () => setJoinSheetVisible(true), variant: 'outline' },
        ]}
      />

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
        <Animated.FlatList
          data={displayedTrips}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <View>
              <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 pt-2 pb-3">
                Mis viajes
              </Text>
              <View className="mb-4 flex-row bg-neutral-200 dark:bg-surface-700 rounded-xl p-1">
                {SEGMENTS.map(({ key, label }) => {
                  const isActive = segment === key
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSegment(key)}
                      activeOpacity={0.8}
                      className={`flex-1 py-[7px] rounded-lg items-center ${
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
              <View className="flex-row gap-3 mb-3">
                <Button
                  onPress={() => router.push('/(app)/trips/new')}
                  className="flex-1"
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text className="text-white text-[17px] font-semibold ml-1.5">Crear viaje</Text>
                </Button>
                <Button
                  onPress={() => setJoinSheetVisible(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Ionicons name="enter-outline" size={18} color="#0046de" />
                  <Text className="text-primary-500 text-[17px] font-semibold ml-1.5">Unirse</Text>
                </Button>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => router.push(`/(app)/trips/${item.id}/timeline`)}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
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
          <View style={ctaShadow}>
            <Button onPress={handleSubmit(onJoinSubmit)} isLoading={joinTrip.isPending}>
              Unirse al viaje
            </Button>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}
