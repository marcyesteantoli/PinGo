import { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import {
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader, AppLargeTitle, useAppHeader } from '@components/ui/AppHeader'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { Badge } from '@components/ui/Badge'
import { RadarChart } from '@components/ui/RadarChart'
import { EXPERIENCE_TYPE_LABELS } from '@features/timeline/types'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { SavedExperienceItem } from '@types/index'
import type { BadgeVariant } from '@components/ui/Badge'
import type { Experience } from '@types/index'

const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  transport: 'transport',
  accommodation: 'accommodation',
  activity: 'activity',
  restaurant: 'restaurant',
  other: 'other',
}

function getLocationText(location: unknown): string | null {
  if (
    typeof location === 'object' &&
    location !== null &&
    'name' in location &&
    typeof (location as { name: unknown }).name === 'string'
  ) {
    return (location as { name: string }).name
  }
  return null
}

interface SavedExperienceCardProps {
  item: SavedExperienceItem
  isDark: boolean
  onPress: () => void
}

function SavedExperienceCard({ item, isDark, onPress }: SavedExperienceCardProps) {
  const { experience } = item
  const cardBg = isDark ? colors.surface[800] : colors.white
  const labelColor = isDark ? colors.neutral[500] : colors.neutral[400]

  const attributes = EXPERIENCE_ATTRIBUTES[experience.type as Experience['type']] ?? []
  const userValues: Record<string, number> = {}
  for (const r of experience.attribute_ratings) {
    userValues[r.attribute] = r.value
  }
  const ratedCount = Object.keys(userValues).length
  const hasEnoughRatings = ratedCount >= 3 && attributes.length >= 3

  const locationText = getLocationText(experience.location)

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: cardBg,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Badge
            label={EXPERIENCE_TYPE_LABELS[experience.type as Experience['type']]}
            variant={TYPE_BADGE_VARIANT[experience.type]}
          />
          {experience.trip?.name && (
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, color: labelColor, flexShrink: 1, marginLeft: 8 }}
            >
              {experience.trip.name}
            </Text>
          )}
        </View>

        <Text
          numberOfLines={2}
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? colors.neutral[50] : colors.neutral[900],
            marginBottom: locationText ? 4 : 0,
          }}
        >
          {experience.title}
        </Text>

        {locationText && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={15} color={labelColor} />
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, color: labelColor, flex: 1 }}
            >
              {locationText}
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          padding: 16,
          alignItems: 'center',
        }}
      >
        {hasEnoughRatings ? (
          <RadarChart
            attributes={attributes}
            userValues={userValues}
            groupAvg={{}}
            size={160}
            isDark={isDark}
          />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
            <Ionicons name="star-outline" size={16} color={labelColor} />
            <Text style={{ fontSize: 13, color: labelColor }}>
              {attributes.length === 0
                ? 'Sin atributos para este tipo'
                : 'Valora los atributos para ver tu gráfico'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function SavedExperiencesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { scrollY, onScroll } = useAppHeader()
  const [search, setSearch] = useState('')

  const { data: saved = [], isLoading } = useSavedExperiences()

  const filtered = useMemo(() => {
    if (!search.trim()) return saved
    const q = search.toLowerCase()
    return saved.filter((item) => {
      const loc = getLocationText(item.experience.location)?.toLowerCase() ?? ''
      const title = item.experience.title.toLowerCase()
      return loc.includes(q) || title.includes(q)
    })
  }, [saved, search])

  const bg = isDark ? colors.surface[900] : colors.neutral[100]
  const searchBg = isDark ? colors.surface[800] : colors.white
  const labelColor = isDark ? colors.neutral[500] : colors.neutral[400]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <AppHeader title="Mis joyas" scrollY={scrollY} />
      <Animated.View
        style={{
          overflow: 'hidden',
          height: scrollY.interpolate({
            inputRange: [0, 44],
            outputRange: [57, 0],
            extrapolate: 'clamp',
          }),
        }}
      >
        <AppLargeTitle title="Mis joyas" scrollY={scrollY} />
      </Animated.View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: searchBg,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <Ionicons name="search" size={16} color={labelColor} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por lugar o nombre..."
            placeholderTextColor={labelColor}
            style={{
              flex: 1,
              fontSize: 15,
              color: isDark ? colors.neutral[50] : colors.neutral[900],
              padding: 0,
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: labelColor }}>Cargando...</Text>
        </View>
      ) : saved.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="bookmark-outline" size={52} color={labelColor} style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDark ? colors.neutral[200] : colors.neutral[700],
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Aún no tienes joyas
          </Text>
          <Text style={{ fontSize: 15, color: labelColor, textAlign: 'center', lineHeight: 22 }}>
            Guarda las experiencias que te han enamorado con el marcador en la ficha de cada experiencia.
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 32 }}>
              <Text style={{ fontSize: 15, color: labelColor }}>
                Sin resultados para "{search}"
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <SavedExperienceCard
                key={item.experience.id}
                item={item}
                isDark={isDark}
                onPress={() =>
                  router.push(`/saved-experiences/${item.experience.id}`)
                }
              />
            ))
          )}
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  )
}
