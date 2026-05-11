import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { EmptyState } from '@components/ui/EmptyState'
import { Input } from '@components/ui/Input'
import { SkeletonCard } from '@components/ui/Skeleton'
import { ThemeToggle } from '@components/ui/ThemeToggle'
import { TripCard } from '@features/trips/components/TripCard'
import { useJoinTrip } from '@features/trips/hooks/useJoinTrip'
import { useTrips } from '@features/trips/hooks/useTrips'
import { joinTripSchema, type JoinTripFormData } from '@features/trips/types'
import { useTheme } from '@lib/theme'

export default function DashboardScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { data: trips, isLoading, error, refetch } = useTrips()
  const joinTrip = useJoinTrip()
  const [joinSheetVisible, setJoinSheetVisible] = useState(false)

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

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-surface-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50">Mis viajes</Text>
        <View className="flex-row gap-2">
          <ThemeToggle className="bg-neutral-100 dark:bg-surface-700" />
          <TouchableOpacity
            onPress={() => setJoinSheetVisible(true)}
            className="w-11 h-11 rounded-[10px] bg-neutral-100 dark:bg-surface-700 items-center justify-center"
          >
            <Ionicons name="enter-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(app)/trips/new')}
            className="w-11 h-11 rounded-[10px] bg-primary-500 items-center justify-center"
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
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
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 gap-3 pb-8"
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => router.push(`/(app)/trips/${item.id}/timeline`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="airplane-outline"
              title="Sin viajes todavía"
              subtitle="Crea tu primer viaje o únete con un código"
              actionLabel="Crear viaje"
              onAction={() => router.push('/(app)/trips/new')}
            />
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
