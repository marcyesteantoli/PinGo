import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSavedExperienceDetail } from '@features/saved/hooks/useSavedExperienceDetail'
import { useUpsertSavedNote } from '@features/saved/hooks/useUpsertSavedNote'
import { useIsSaved } from '@features/saved/hooks/useIsSaved'
import { useToggleSaveExperience } from '@features/saved/hooks/useToggleSaveExperience'
import { Badge } from '@components/ui/Badge'
import { AttributeRatingSection } from '@features/timeline/components/AttributeRatingSection'
import { EXPERIENCE_TYPE_LABELS } from '@features/timeline/types'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import type { BadgeVariant } from '@components/ui/Badge'
import type { Experience } from '@types/index'


const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  other: 'other',
}

export default function SavedExperienceDetailScreen() {
  const router = useRouter()
  const { experienceId } = useLocalSearchParams<{ experienceId: string }>()
  const { isDark } = useTheme()

  const { data, isLoading } = useSavedExperienceDetail(experienceId)
  const { data: isSaved = true } = useIsSaved(experienceId)
  const toggleSave = useToggleSaveExperience(experienceId)
  const upsertNote = useUpsertSavedNote(experienceId)

  const [noteText, setNoteText] = useState<string | undefined>(undefined)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function handleUnsave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    toggleSave.mutate(true, {
      onSuccess: () => router.back(),
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">Cargando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="flex-row items-center px-4 py-3.5"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400">Joya no encontrada</Text>
        </View>
      </SafeAreaView>
    )
  }

  const { experience, note } = data
  const attributes = EXPERIENCE_ATTRIBUTES[experience.type as Experience['type']] ?? []
  const hasAttributes = attributes.length > 0
  const location = experience.location

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top']}>
      {/* iOS-style nav bar */}
      <View className="flex-row items-center px-2 py-2.5 bg-neutral-100 dark:bg-surface-900">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="flex-row items-center pl-2 pr-3 min-w-[80px]"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary[500]} />
          <Text className="text-[17px] ml-0.5" style={{ color: colors.primary[500] }}>Mis Joyas</Text>
        </TouchableOpacity>
        <View className="flex-1" />
        <TouchableOpacity
          onPress={handleUnsave}
          hitSlop={8}
          className="px-3 py-1.5"
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.primary[500] : (isDark ? colors.neutral[400] : colors.neutral[500])}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-4">
            <View className="flex-row items-start justify-between mb-2.5">
              <Badge
                label={EXPERIENCE_TYPE_LABELS[experience.type]}
                variant={TYPE_BADGE_VARIANT[experience.type]}
              />
              {experience.trip?.name && (
                <Text
                  numberOfLines={1}
                  className="text-[13px] text-neutral-500 dark:text-neutral-400 shrink ml-2 mt-0.5"
                >
                  {experience.trip.name}
                </Text>
              )}
            </View>
            <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50 leading-[30px]">
              {experience.title}
            </Text>
          </View>
        </View>

        {/* Location + map card */}
        {location && (
          <View className="rounded-2xl mb-3" style={cardShadow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const googleNativeUrl = `comgooglemaps://?q=${encodeURIComponent(location.name)}&center=${location.lat},${location.lng}`
                const fallbackUrl = Platform.OS === 'ios'
                  ? `maps://?ll=${location.lat},${location.lng}&q=${encodeURIComponent(location.name)}`
                  : `geo:${location.lat},${location.lng}?q=${encodeURIComponent(location.name)}`
                Linking.canOpenURL(googleNativeUrl).then((supported) =>
                  Linking.openURL(supported ? googleNativeUrl : fallbackUrl)
                )
              }}
              className="rounded-2xl overflow-hidden"
            >
              <MapView
                style={{ height: 180, width: '100%' }}
                region={{
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
              >
                <Marker coordinate={{ latitude: location.lat, longitude: location.lng }} />
              </MapView>
              <View className="bg-white dark:bg-surface-800 px-4 py-3 flex-row items-center gap-2.5">
                <Ionicons name="location" size={16} color={colors.primary[500]} />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm text-neutral-700 dark:text-neutral-200"
                >
                  {location.name}
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Personal note card */}
        <View className="rounded-2xl mb-3" style={cardShadow}>
          <View className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">
            <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-4 pt-3.5 pb-1.5">
              Mi nota
            </Text>
            <View
              className="px-4 py-3 border-neutral-100 dark:border-surface-700"
              style={{ borderTopWidth: 0.5 }}
            >
              <TextInput
                value={noteText ?? note ?? ''}
                onChangeText={(text) => {
                  setNoteText(text)
                  clearTimeout(noteTimer.current)
                  noteTimer.current = setTimeout(() => upsertNote.mutate(text), 800)
                }}
                onBlur={() => {
                  clearTimeout(noteTimer.current)
                  upsertNote.mutate(noteText ?? note ?? '')
                }}
                placeholder="Escribe tu recomendación personal..."
                placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
                multiline
                style={{
                  fontSize: 15,
                  color: isDark ? colors.neutral[50] : colors.neutral[900],
                  minHeight: 80,
                  textAlignVertical: 'top',
                  padding: 0,
                }}
              />
            </View>
          </View>
        </View>

        {hasAttributes && (
          <AttributeRatingSection
            experienceId={experienceId}
            experienceType={experience.type as Experience['type']}
            cardBg={isDark ? colors.surface[800] : colors.white}
            labelColor={isDark ? colors.neutral[500] : colors.neutral[400]}
            borderColor={isDark ? colors.surface[700] : colors.neutral[100]}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
