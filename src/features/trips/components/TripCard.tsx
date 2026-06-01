import { memo, useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { Dimensions, Share, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Avatar } from '@components/ui/Avatar'
import { Badge } from '@components/ui/Badge'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { DateRangePicker } from '@components/ui/DateRangePicker'
import { formatDateRange } from '@utils/date'
import { useTheme } from '@lib/theme'
import type { TripWithCollaborators } from '@features/trips/hooks/useTrips'
import { useDeleteTrip } from '../hooks/useDeleteTrip'
import { useUpdateTrip } from '../hooks/useUpdateTrip'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import { useErrorToast } from '@lib/errorToast'

interface TripCardProps {
  trip: TripWithCollaborators
  onPress: () => void
}

// TODO: Design a first-run flow onboarding

type TripStatus = 'upcoming' | 'active' | 'past'

const ACTION_WIDTH = 72
const ACTIONS_WIDTH = ACTION_WIDTH * 2

function getTripStatus(startDate: string, endDate: string): TripStatus {
  const today = new Date().toISOString().split('T')[0]
  if (endDate < today) return 'past'
  if (startDate > today) return 'upcoming'
  return 'active'
}

function getDaysUntil(startDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate + 'T00:00:00')
  return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getTripDays(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1)
}

export const TripCard = memo(function TripCard({ trip, onPress }: TripCardProps) {
  const { isDark } = useTheme()
  const { collaborators } = trip
  const days = getTripDays(trip.start_date, trip.end_date)
  const status = getTripStatus(trip.start_date, trip.end_date)
  const daysUntil = status === 'upcoming' ? getDaysUntil(trip.start_date) : 0

  const deleteTrip = useDeleteTrip()
  const updateTrip = useUpdateTrip()
  const showError = useErrorToast()

  useEffect(() => {
    if (updateTrip.error) showError(updateTrip.error.message)
  }, [updateTrip.error])

  const [containerWidth, setContainerWidth] = useState(() => Dimensions.get('window').width - 40)
  const [renameVisible, setRenameVisible] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [newTitle, setNewTitle] = useState(trip.title)
  const [newStartDate, setNewStartDate] = useState(trip.start_date)
  const [newEndDate, setNewEndDate] = useState(trip.end_date)

  const translateX = useSharedValue(0)
  const savedX = useSharedValue(0)

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => {
      savedX.value = translateX.value
    })
    .onUpdate((e) => {
      translateX.value = Math.min(0, Math.max(-ACTIONS_WIDTH, savedX.value + e.translationX))
    })
    .onEnd(() => {
      translateX.value = translateX.value < -ACTIONS_WIDTH / 2
        ? withTiming(-ACTIONS_WIDTH, { duration: 240, easing: Easing.out(Easing.cubic) })
        : withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const closeSwipe = () => {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
  }

  const handleEditPress = () => {
    closeSwipe()
    setNewTitle(trip.title)
    setNewStartDate(trip.start_date)
    setNewEndDate(trip.end_date)
    setRenameVisible(true)
  }

  const handleDeletePress = () => {
    closeSwipe()
    setDeleteVisible(true)
  }

  const handleRenameConfirm = () => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    const titleChanged = trimmed !== trip.title
    const startChanged = newStartDate !== trip.start_date
    const endChanged = newEndDate !== trip.end_date
    if (!titleChanged && !startChanged && !endChanged) {
      setRenameVisible(false)
      return
    }
    updateTrip.mutate(
      {
        tripId: trip.id,
        title: trimmed,
        start_date: startChanged ? newStartDate : undefined,
        end_date: endChanged ? newEndDate : undefined,
      },
      { onSuccess: () => setRenameVisible(false) }
    )
  }

  const handleDeleteConfirm = () => {
    deleteTrip.mutate(trip.id, {
      onSuccess: () => setDeleteVisible(false),
    })
  }

  const statusConfig: Record<TripStatus, { label: string; variant: 'active' | 'primary' | 'neutral' }> = {
    active:   { label: 'En curso',             variant: 'active'  },
    upcoming: { label: `En ${daysUntil} días`, variant: 'primary' },
    past:     { label: 'Completado',           variant: 'neutral' },
  }

  const { label, variant } = statusConfig[status]
  const borderColor = isDark ? colors.surface[700] : colors.white
  const subtleColor = colors.neutral[400]

  const rowWidth = containerWidth > 0 ? containerWidth + ACTIONS_WIDTH : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  const cardBody = (
    <>
      <View className="flex-row items-start justify-between gap-3 mb-2.5">
        <Text
          className="flex-1 text-[20px] font-bold text-neutral-900 dark:text-neutral-50"
          numberOfLines={1}
        >
          {trip.title}
        </Text>
        <Badge label={label} variant={variant} />
      </View>

      <View className="flex-row items-center gap-1.5 mb-3.5">
        <Ionicons name="calendar-outline" size={14} color={subtleColor} />
        <Text className="text-[13px] text-neutral-500 dark:text-neutral-400">
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>
        <View className="rounded bg-neutral-100 dark:bg-surface-700 px-1.5 py-0.5">
          <Text className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
            {days} {days === 1 ? 'día' : 'días'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 mt-1 border-t border-neutral-100 dark:border-surface-700">
        {collaborators.length > 0 ? (
          <View className="flex-row items-center gap-2">
            <View className="flex-row">
              {collaborators.slice(0, 4).map((c, i) => (
                <View
                  key={c.user_id}
                  style={{
                    marginLeft: i > 0 ? -9 : 0,
                    zIndex: 10 - i,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    borderColor,
                  }}
                >
                  <Avatar name={c.name} uri={c.avatar_url} size="sm" />
                </View>
              ))}
              {collaborators.length > 4 && (
                <View
                  style={{
                    marginLeft: -9,
                    zIndex: 6,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor,
                    backgroundColor: isDark ? colors.surface[700] : '#F2F2F7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '500',
                      color: isDark ? '#EBEBF5' : '#3C3C43',
                      letterSpacing: -0.2,
                    }}
                  >
                    +{collaborators.length - 4}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
              {collaborators.length} {collaborators.length === 1 ? 'persona' : 'personas'}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <TouchableOpacity
          onPress={() =>
            Share.share({
              message: `Únete a "${trip.title}" en PinGo con el código: ${trip.join_code}`,
            })
          }
          activeOpacity={0.7}
          className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-surface-700 items-center justify-center"
        >
          <Ionicons name="share-outline" size={18} color={subtleColor} />
        </TouchableOpacity>
      </View>
    </>
  )

  const cardContent = (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="rounded-2xl p-4"
      style={{
        backgroundColor: isDark ? colors.surface[800] : colors.white,
      }}
    >
      {cardBody}
    </TouchableOpacity>
  )

  return (
    <>
      <View
        className="rounded-2xl"
        style={[
          { opacity: containerWidth > 0 ? 1 : 0 },
          cardShadow,
          status === 'active' && {
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(0,70,222,0.50)' : 'rgba(0,70,222,0.35)',
          },
        ]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width
          if (w > 0 && w !== containerWidth) setContainerWidth(w)
        }}
      >
        <View className="overflow-hidden rounded-2xl">
          <Animated.View style={[{ flexDirection: 'row', width: rowWidth }, cardStyle]}>
            <GestureDetector gesture={pan}>
              <View style={{ width: cardWidth, flex: cardWidth === undefined ? 1 : undefined }}>
                {cardContent}
              </View>
            </GestureDetector>

            {/* Edit action */}
            <TouchableOpacity
              onPress={handleEditPress}
              style={{ width: ACTION_WIDTH, backgroundColor: colors.primary[500] }}
              className="items-center justify-center gap-1"
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '600' }}>Editar</Text>
            </TouchableOpacity>

            {/* Delete action */}
            <TouchableOpacity
              onPress={handleDeletePress}
              style={{ width: ACTION_WIDTH, backgroundColor: colors.error }}
              className="items-center justify-center gap-1"
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '600' }}>Eliminar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Edit sheet */}
      <BottomSheet
        visible={renameVisible}
        onClose={() => setRenameVisible(false)}
        title="Editar viaje"
      >
        <View className="gap-4 mb-2">
          <View className="gap-1">
            <Text className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              Nombre del viaje
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRenameConfirm}
              className="rounded-xl px-4 py-2.5 text-[17px] text-neutral-900 dark:text-neutral-50 bg-neutral-100 dark:bg-surface-700"
              placeholderTextColor={colors.neutral[400]}
              placeholder="Nombre del viaje"
            />
          </View>
          <DateRangePicker
            startDate={newStartDate}
            endDate={newEndDate}
            onStartDateChange={setNewStartDate}
            onEndDateChange={setNewEndDate}
            minDate=""
          />
          <Button
            onPress={handleRenameConfirm}
            isLoading={updateTrip.isPending}
          >
            Guardar
          </Button>
        </View>
      </BottomSheet>

      {/* Delete confirm sheet */}
      <BottomSheet
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        title="Eliminar viaje"
      >
        <View className="gap-4 mb-2">
          <View className="flex-row items-start gap-3 bg-error/10 rounded-2xl p-4">
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">
              Se eliminará «{trip.title}» y todos sus datos permanentemente. Esta acción no se puede deshacer.
            </Text>
          </View>
          <Button
            variant="destructive"
            onPress={handleDeleteConfirm}
            isLoading={deleteTrip.isPending}
          >
            Eliminar viaje
          </Button>
          <TouchableOpacity onPress={() => setDeleteVisible(false)} className="py-3 items-center">
            <Text className="text-neutral-500 font-medium">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  )
})
