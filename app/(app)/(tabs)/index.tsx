import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader, useAppHeader } from '@components/ui/AppHeader'
import { ctaShadow, fabShadow } from '@lib/shadows'
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
import { SegmentedTabBar } from '@components/ui/SegmentedTabBar'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useFabScroll } from '@lib/useFabScroll'
import { EASE_OUT, DURATION } from '@lib/animations'
import type { TripWithCollaborators } from '@features/trips/hooks/useTrips'

type Segment = 'upcoming' | 'past'

function StaggeredTripCard({
  trip,
  index,
  onPress,
}: {
  trip: TripWithCollaborators
  index: number
  onPress: () => void
}) {
  const staggerStyle = useStaggerEnter(index, { delay: 60, duration: 280 })
  return (
    <Animated.View style={staggerStyle}>
      <TripCard trip={trip} onPress={onPress} />
    </Animated.View>
  )
}

function FabOption({
  onPress,
  children,
}: {
  onPress: () => void
  children: React.ReactNode
}) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT }) }}
      onPressOut={() => { scale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
    >
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const { data: trips, isLoading, error, refetch } = useTrips()
  const joinTrip = useJoinTrip()
  const showError = useErrorToast()
  const [joinSheetVisible, setJoinSheetVisible] = useState(false)
  const [segment, setSegment] = useState<Segment>('upcoming')
  const [fabOpen, setFabOpen] = useState(false)

  useEffect(() => {
    if (joinTrip.error) showError(joinTrip.error.message)
  }, [joinTrip.error])
  const { scrollY, scrollHandler } = useAppHeader()

  const { control, handleSubmit, reset, formState: { errors } } = useForm<JoinTripFormData>({
    resolver: zodResolver(joinTripSchema),
  })

  const scrollRef = useAnimatedRef<Animated.ScrollView>()

  const fabProgress = useSharedValue(0)
  const contentOpacity = useSharedValue(1)

  const toggleFab = () => {
    const next = !fabOpen
    setFabOpen(next)
    fabProgress.value = withTiming(next ? 1 : 0, { duration: 200 })
  }

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(fabProgress.value, [0, 1], [0, 45])}deg` }],
  }))

  const option1Style = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [{ translateY: interpolate(fabProgress.value, [0, 1], [20, 0]) }],
  }))

  const option2Style = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [{ translateY: interpolate(fabProgress.value, [0, 1], [40, 0]) }],
  }))

  const fabBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fabProgress.value, [0, 1], ['#0046de', '#ef4444']),
  }))

  const { fabAnimStyle } = useFabScroll(scrollY)

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }))

  const handleSegmentChange = (key: string) => {
    scrollTo(scrollRef, 0, 0, true)
    contentOpacity.value = withTiming(0, { duration: 100, easing: EASE_OUT })
    setTimeout(() => setSegment(key as Segment), 110)
  }

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: DURATION.normal, easing: EASE_OUT })
  }, [segment])

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
      />

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
        <Animated.ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[1]}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* index 0: título scrollea hacia arriba */}
          <View className="px-5">
            <Text className="text-[34px] font-bold text-neutral-900 dark:text-neutral-50 pt-2 pb-3">
              Mis viajes
            </Text>
          </View>

          {/* index 1: tab bar sticky */}
          <View className="bg-neutral-100 dark:bg-surface-900">
            <SegmentedTabBar
              tabs={[
                { key: 'upcoming', label: 'Próximos' },
                { key: 'past', label: 'Pasados' },
              ]}
              active={segment}
              onChange={handleSegmentChange}
            />
          </View>

          {/* index 2: contenido */}
          <Animated.View style={contentAnimStyle} className="px-5 pt-2 pb-8 gap-5">
            {displayedTrips.length === 0 ? (
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
            ) : (
              displayedTrips.map((item, index) => (
                <StaggeredTripCard
                  key={item.id}
                  trip={item}
                  index={index}
                  onPress={() => router.push(`/(app)/trips/${item.id}/timeline`)}
                />
              ))
            )}
          </Animated.View>
        </Animated.ScrollView>
      )}

      {/* Overlay para cerrar FAB */}
      {fabOpen && (
        <Pressable className="absolute inset-0" onPress={toggleFab} />
      )}

      {/* Speed Dial FAB */}
      <Animated.View className="absolute right-5 items-end gap-3" style={[fabAnimStyle, { bottom: 16 }]} pointerEvents="box-none">
        {/* Opción Unirse */}
        <Animated.View style={option2Style} pointerEvents={fabOpen ? 'auto' : 'none'}>
          <FabOption onPress={() => { toggleFab(); setJoinSheetVisible(true) }}>
            <View className="px-4 py-2 bg-white dark:bg-surface-700 rounded-full" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 }}>
              <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">Unirse</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-white dark:bg-surface-700 border border-primary-500 items-center justify-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name="enter-outline" size={22} color="#0046de" />
            </View>
          </FabOption>
        </Animated.View>

        {/* Opción Crear viaje */}
        <Animated.View style={option1Style} pointerEvents={fabOpen ? 'auto' : 'none'}>
          <FabOption onPress={() => { toggleFab(); router.push('/(app)/trips/new') }}>
            <View className="px-4 py-2 bg-white dark:bg-surface-700 rounded-full" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 }}>
              <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">Crear viaje</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center" style={{ shadowColor: '#0046de', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </View>
          </FabOption>
        </Animated.View>

        {/* FAB principal */}
        <TouchableOpacity
          onPress={toggleFab}
          activeOpacity={0.85}
          className="w-14 h-14 rounded-full items-center justify-center"
        >
          <Animated.View style={[fabBgStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, ...fabShadow }]} />
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={28} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

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
