import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Share, Text, TouchableOpacity, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { SharedValue } from 'react-native-reanimated'
import { Avatar } from '@components/ui/Avatar'
import { BottomSheet } from '@components/ui/BottomSheet'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useProfile } from '@features/auth/hooks/useProfile'
import { useTheme } from '@lib/theme'
import { useTripContext } from '../TripProvider'
import { formatShortDate } from '@utils/date'
import { colors } from '@lib/colors'

const COLLAPSE_THRESHOLD = 60

interface TripHeaderProps {
  scrollY?: SharedValue<number>
}

export function TripHeader({ scrollY }: TripHeaderProps) {
  const router = useRouter()
  const { trip, collaborators } = useTripContext()
  const { data: user } = useCurrentUser()
  const { data: profile } = useProfile(user?.id)
  const { isDark } = useTheme()
  const [membersVisible, setMembersVisible] = useState(false)
  const [joinCodeVisible, setJoinCodeVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await Clipboard.setStringAsync(trip.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const internalScrollY = useSharedValue(0)
  const activeScrollY = scrollY ?? internalScrollY

  const isMeasured = useSharedValue(false)
  const detailHeightSV = useSharedValue(0)
  const headerProgress = useSharedValue(0)

  useAnimatedReaction(
    () => activeScrollY.value,
    (y) => {
      if (y > COLLAPSE_THRESHOLD && headerProgress.value < 0.5) {
        headerProgress.value = withTiming(1, { duration: 180 })
      } else if (y < COLLAPSE_THRESHOLD * 0.4 && headerProgress.value > 0.5) {
        headerProgress.value = withTiming(0, { duration: 180 })
      }
    }
  )

  const dateRange = `${formatShortDate(trip.start_date)} - ${formatShortDate(trip.end_date)}`
  const travelerCount = collaborators.length
  const borderColor = isDark ? colors.surface[800] : colors.white
  const subtleColor = isDark ? colors.neutral[200] : colors.neutral[400]

  const detailAnimStyle = useAnimatedStyle(() => {
    if (!isMeasured.value) return {}
    return {
      height: interpolate(headerProgress.value, [0, 1], [detailHeightSV.value, 0]),
      opacity: interpolate(headerProgress.value, [0, 0.6], [1, 0]),
    }
  })

  const compactTitleAnimStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateX: interpolate(headerProgress.value, [0, 1], [6, 0]) }],
  }))

  return (
    <SafeAreaView className="bg-white dark:bg-surface-800" edges={['top']}>
      <View className="px-5 pt-1">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2 flex-1 overflow-hidden mr-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-8 h-8 items-center justify-center -ml-1"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
            </TouchableOpacity>
            <Animated.Text
              className="text-lg font-semibold text-neutral-500 dark:text-neutral-400 flex-shrink"
              numberOfLines={1}
              style={compactTitleAnimStyle}
            >
              · {trip.title}
            </Animated.Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push('/(app)/profile')}
              className="w-8 h-8 rounded-full overflow-hidden"
            >
              <Avatar
                uri={profile?.avatar_url}
                name={profile?.name ?? user?.user_metadata?.name ?? 'U'}
                size="sm"
              />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          style={[{ overflow: 'hidden' }, detailAnimStyle]}
          onLayout={(e) => {
            if (!isMeasured.value) {
              detailHeightSV.value = e.nativeEvent.layout.height
              isMeasured.value = true
            }
          }}
        >
          <Text
            className="text-[26px] font-bold text-neutral-900 dark:text-neutral-50 leading-tight mb-1"
            numberOfLines={2}
          >
            {trip.title}
          </Text>

          <View className="flex-row items-center justify-between pb-3">
            <Text className="text-[15px] font-medium text-primary-500">{dateRange}</Text>

            <TouchableOpacity
              onPress={() => setMembersVisible(true)}
              className="flex-row items-center gap-1.5"
              activeOpacity={0.7}
            >
              <View className="flex-row">
                {collaborators.slice(0, 4).map((c, i) => (
                  <View
                    key={c.user_id}
                    style={{
                      marginLeft: i > 0 ? -8 : 0,
                      zIndex: 10 - i,
                      borderRadius: 17,
                      borderWidth: 2,
                      borderColor,
                    }}
                  >
                    <Avatar name={c.name} uri={c.avatar_url} size="sm" />
                  </View>
                ))}
                {collaborators.length > 4 && (
                  <View
                    style={{
                      marginLeft: -8,
                      zIndex: 6,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor,
                      backgroundColor: isDark ? colors.surface[700] : colors.neutral[200],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                      +{collaborators.length - 4}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-[13px] text-neutral-400 dark:text-neutral-200">
                {travelerCount} {travelerCount === 1 ? 'viajero' : 'viajeros'}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={subtleColor} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      <BottomSheet
        visible={membersVisible}
        onClose={() => setMembersVisible(false)}
        title="Viajeros"
      >
        <View className="mb-2">
          {collaborators.map((c, i) => (
            <View
              key={c.user_id}
              className="flex-row items-center gap-3 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: isDark ? colors.surface[700] : colors.neutral[100] }}
            >
              <Avatar name={c.name} uri={c.avatar_url} size="md" />
              <Text className="flex-1 text-[15px] font-medium text-neutral-900 dark:text-neutral-50">
                {c.name}
              </Text>
              {c.role === 'owner' && (
                <View className="bg-primary-50 dark:bg-primary-900/30 rounded-full px-2.5 py-1">
                  <Text className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                    Organizador
                  </Text>
                </View>
              )}
            </View>
          ))}
          <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: isDark ? colors.surface[700] : colors.neutral[100] }}>
            <Text className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 mb-3">
              Código de invitación
            </Text>
            <TouchableOpacity
              onPress={handleCopy}
              className="bg-neutral-100 dark:bg-surface-700 rounded-2xl py-4 mb-3 items-center flex-row justify-center gap-2"
              activeOpacity={0.7}
            >
              <Text
                className="text-[36px] font-bold tracking-[10px] text-neutral-900 dark:text-neutral-50"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {trip.join_code}
              </Text>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={20}
                color={copied ? colors.primary[500] : subtleColor}
              />
            </TouchableOpacity>
            {copied && (
              <Text className="text-[12px] text-primary-500 text-center mb-2">¡Copiado!</Text>
            )}
            <TouchableOpacity
              onPress={() =>
                Share.share({
                  message: `Únete a "${trip.title}" en PinGo con el código: ${trip.join_code}`,
                })
              }
              className="bg-primary-500 rounded-2xl py-3.5 flex-row items-center gap-2 justify-center mb-2"
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color="white" />
              <Text className="text-[15px] font-semibold text-white">Compartir código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={joinCodeVisible}
        onClose={() => setJoinCodeVisible(false)}
        title="Invitar viajeros"
      >
        <View className="pb-2">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 text-center mb-5">
            Comparte este código para que otros puedan unirse al viaje
          </Text>
          <TouchableOpacity
            onPress={handleCopy}
            className="bg-neutral-100 dark:bg-surface-700 rounded-2xl py-5 mb-3 items-center flex-row justify-center gap-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-[40px] font-bold tracking-[12px] text-neutral-900 dark:text-neutral-50"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {trip.join_code}
            </Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={22}
              color={copied ? colors.primary[500] : subtleColor}
            />
          </TouchableOpacity>
          {copied && (
            <Text className="text-[12px] text-primary-500 text-center mb-3">¡Copiado!</Text>
          )}
          <TouchableOpacity
            onPress={() =>
              Share.share({
                message: `Únete a "${trip.title}" en PinGo con el código: ${trip.join_code}`,
              })
            }
            className="bg-primary-500 rounded-2xl py-4 flex-row items-center gap-2 justify-center mb-2"
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color="white" />
            <Text className="text-[17px] font-semibold text-white">Compartir código</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}
