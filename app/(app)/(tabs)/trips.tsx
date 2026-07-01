import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, RefreshControl, Text, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
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
import { ActiveTripLimitReachedError } from '@features/trips/hooks/useCreateTrip'
import { useTrips } from '@features/trips/hooks/useTrips'
import { buildJoinTripSchema, type JoinTripFormData } from '@features/trips/types'
import { SegmentedTabBar } from '@components/ui/SegmentedTabBar'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useFabScroll } from '@lib/useFabScroll'
import { EASE_OUT, DURATION } from '@lib/animations'
import type { TripWithCollaborators } from '@features/trips/hooks/useTrips'
import { useIsPro } from '@features/premium/hooks/useIsPro'
import { ProPaywallSheet } from '@features/premium/components/ProPaywallSheet'
import { LIMITS } from '@/config/limits'
import { getErrorMessage } from '@lib/errors'

//TODO: monitorizacion de la app reel insta 

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

export default function TripsScreen() {
  const router = useRouter()
  const { data: trips, isLoading, isFetching, error, refetch } = useTrips()
  const joinTrip = useJoinTrip()
  const [joinSheetVisible, setJoinSheetVisible] = useState(false)
  const [segment, setSegment] = useState<Segment>('upcoming')
  const [fabOpen, setFabOpen] = useState(false)
  const [tripsPaywallVisible, setTripsPaywallVisible] = useState(false)
  const { isPro, isLoading: isProLoading } = useIsPro()
  const { scrollY, scrollHandler } = useAppHeader()
  const { t } = useTranslation()

  const joinSchema = useMemo(() => buildJoinTripSchema(), [t])

  const { control, handleSubmit, reset, formState: { errors } } = useForm<JoinTripFormData>({
    resolver: zodResolver(joinSchema),
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
    backgroundColor: interpolateColor(fabProgress.value, [0, 1], ['#0046de', '#ef233c']),
  }))

  const fabMainScale = useSharedValue(1)
  const fabMainAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabMainScale.value }],
  }))

  const { fabAnimStyle } = useFabScroll(scrollY)

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }))

  const handleSegmentChange = (key: string) => {
    if (key === segment) return
    scrollTo(scrollRef, 0, 0, true)
    contentOpacity.value = withTiming(0, { duration: 100, easing: EASE_OUT }, () => {
      runOnJS(setSegment)(key as Segment)
    })
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
    } catch (err) {
      if (err instanceof ActiveTripLimitReachedError) {
        setJoinSheetVisible(false)
        reset()
        setTripsPaywallVisible(true)
      }
      // Other errors shown via joinTrip.error
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const upcomingTrips = trips?.filter(t => t.end_date >= today) ?? []
  const pastTrips    = trips?.filter(t => t.end_date <  today) ?? []
  const displayedTrips = segment === 'upcoming' ? upcomingTrips : pastTrips

  const handleCreateTripPress = () => {
    if (!isPro && !isProLoading && upcomingTrips.length >= LIMITS.FREE_MAX_ACTIVE_TRIPS) {
      setTripsPaywallVisible(true)
      return
    }
    router.push('/(app)/trips/new')
  }

  const headerSubtitle = !trips?.length
    ? t('trips_header_empty')
    : segment === 'upcoming'
      ? t('trips_header_upcoming', { count: upcomingTrips.length })
      : t('trips_header_past', { count: pastTrips.length })

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      <AppHeader
        title={t('trips_title')}
        subtitle={headerSubtitle}
        scrollY={scrollY}
      />

      {isLoading ? (
        <View className="px-5 gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <Animated.ScrollView
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <EmptyState
            icon="warning-outline"
            title={t('trips_error_title')}
            subtitle={getErrorMessage(error, t)}
          />
          <View className="items-center mt-4">
            <Button onPress={() => refetch()} variant="ghost">{t('common_retry')}</Button>
          </View>
        </Animated.ScrollView>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[0]}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* index 0: tab bar sticky */}
          <View className="bg-neutral-100 dark:bg-surface-900 pt-2">
            <SegmentedTabBar
              tabs={[
                { key: 'upcoming', label: t('trips_segment_upcoming') },
                { key: 'past', label: t('trips_segment_past') },
              ]}
              active={segment}
              onChange={handleSegmentChange}
            />
          </View>

          {/* index 1: contenido */}
          <Animated.View style={contentAnimStyle} className="px-5 pt-2 pb-8 gap-5">
            {displayedTrips.length === 0 ? (
              segment === 'upcoming' ? (
                <EmptyState
                  icon="airplane-outline"
                  title={t('trips_empty_upcoming_title')}
                  subtitle={t('trips_empty_upcoming_subtitle')}
                  actionLabel={t('trips_empty_upcoming_action')}
                  onAction={handleCreateTripPress}
                />
              ) : (
                <EmptyState
                  icon="checkmark-circle-outline"
                  title={t('trips_empty_past_title')}
                  subtitle={t('trips_empty_past_subtitle')}
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

      {/* Backdrop semi-transparente al abrir FAB */}
      <Animated.View
        className="absolute inset-0"
        style={{ opacity: fabProgress, backgroundColor: 'rgba(0,0,0,0.3)' }}
        pointerEvents={fabOpen ? 'auto' : 'none'}
      >
        <Pressable className="flex-1" onPress={toggleFab} />
      </Animated.View>

      {/* Speed Dial FAB */}
      <Animated.View className="absolute right-5 items-end gap-3" style={[fabAnimStyle, { bottom: 16 }]} pointerEvents="box-none">
        {/* Opción Unirse */}
        <Animated.View style={option2Style} pointerEvents={fabOpen ? 'auto' : 'none'}>
          <FabOption onPress={() => {
            toggleFab()
            if (!isPro && !isProLoading && upcomingTrips.length >= LIMITS.FREE_MAX_ACTIVE_TRIPS) {
              setTripsPaywallVisible(true)
              return
            }
            setJoinSheetVisible(true)
          }}>
            <View className="px-4 py-2 bg-white dark:bg-surface-700 rounded-full" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 }}>
              <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">{t('trips_fab_join')}</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-white dark:bg-surface-700 border border-primary-500 items-center justify-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name="enter-outline" size={22} color="#0046de" />
            </View>
          </FabOption>
        </Animated.View>

        {/* Opción Crear viaje */}
        <Animated.View style={option1Style} pointerEvents={fabOpen ? 'auto' : 'none'}>
          <FabOption onPress={() => { toggleFab(); handleCreateTripPress() }}>
            <View className="px-4 py-2 bg-white dark:bg-surface-700 rounded-full" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 }}>
              <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">{t('trips_fab_create')}</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center" style={{ shadowColor: '#0046de', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </View>
          </FabOption>
        </Animated.View>

        {/* FAB principal */}
        <Pressable
          onPress={toggleFab}
          onPressIn={() => { fabMainScale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT }) }}
          onPressOut={() => { fabMainScale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
        >
          <Animated.View style={[fabMainAnimStyle, { width: 49, height: 49, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }]}>
            <Animated.View style={[fabBgStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, ...fabShadow }]} />
            <Animated.View style={iconStyle}>
              <Ionicons name="add" size={28} color="#ffffff" />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Join sheet */}
      <BottomSheet
        visible={joinSheetVisible}
        onClose={() => { setJoinSheetVisible(false); reset(); joinTrip.reset() }}
        title={t('trips_join_sheet_title')}
      >
        <View className="gap-4">
          <Controller
            control={control}
            name="join_code"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('trips_join_code_label')}
                placeholder={t('trips_join_code_placeholder')}
                value={value}
                onChangeText={(text) => onChange(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                error={errors.join_code?.message}
              />
            )}
          />
          {joinTrip.error && (
            <Text className="text-[13px] text-error">{getErrorMessage(joinTrip.error, t)}</Text>
          )}
          <View style={ctaShadow}>
            <Button onPress={handleSubmit(onJoinSubmit)} isLoading={joinTrip.isPending}>
              {t('trips_join_submit')}
            </Button>
          </View>
        </View>
      </BottomSheet>

      <ProPaywallSheet
        visible={tripsPaywallVisible}
        onClose={() => setTripsPaywallVisible(false)}
        feature="trips"
        isLimitReached
      />
    </SafeAreaView>
  )
}
