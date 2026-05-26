import { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader, useAppHeader } from '@components/ui/AppHeader'
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { Badge } from '@components/ui/Badge'
import { EXPERIENCE_TYPE_LABELS } from '@features/timeline/types'
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

const TYPE_FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: 'Todas' },
  { key: 'restaurant', label: 'Gastronomía' },
  { key: 'activity', label: 'Actividad' },
  { key: 'accommodation', label: 'Alojamiento' },
  { key: 'transport', label: 'Transporte' },
  { key: 'other', label: 'Otro' },
]

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
  const { experience, note } = item
  const cardBg = isDark ? colors.surface[800] : colors.white
  const labelColor = isDark ? colors.neutral[500] : colors.neutral[400]
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
            <Text numberOfLines={1} style={{ fontSize: 13, color: labelColor, flex: 1 }}>
              {locationText}
            </Text>
          </View>
        )}

        {note ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
            <Ionicons name="chatbubble-outline" size={13} color={labelColor} />
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, color: labelColor, flex: 1, fontStyle: 'italic' }}
            >
              {note}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

export default function SavedExperiencesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { scrollY, scrollHandler } = useAppHeader()
  const sectionProgress = useSharedValue(0)
  useAnimatedReaction(
    () => scrollY.value,
    (y) => {
      if (y > 44 && sectionProgress.value < 0.5) {
        sectionProgress.value = withTiming(1, { duration: 180 })
      } else if (y < 18 && sectionProgress.value > 0.5) {
        sectionProgress.value = withTiming(0, { duration: 180 })
      }
    }
  )
  const expandedSectionStyle = useAnimatedStyle(() => ({
    height: interpolate(sectionProgress.value, [0, 1], [57, 0]),
    overflow: 'hidden',
  }))

  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)

  const { data: saved = [], isLoading } = useSavedExperiences()

  const filtered = useMemo(() => {
    let items = saved

    if (activeType) {
      items = items.filter((i) => i.experience.type === activeType)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => {
        const loc = getLocationText(i.experience.location)?.toLowerCase() ?? ''
        const title = i.experience.title.toLowerCase()
        return loc.includes(q) || title.includes(q)
      })
    }

    return items
  }, [saved, activeType, search])

  const bg = isDark ? colors.surface[900] : colors.neutral[100]
  const searchBg = isDark ? colors.surface[800] : colors.white
  const labelColor = isDark ? colors.neutral[500] : colors.neutral[400]

  const isFiltered = !!activeType || !!search.trim()
  const activeTypeLabel = TYPE_FILTERS.find((f) => f.key === activeType)?.label ?? ''

  const listHeader = (
    <View>
      <Animated.View style={expandedSectionStyle}>
        <Text
          style={{
            fontSize: 34,
            fontWeight: '700',
            color: isDark ? colors.neutral[50] : colors.neutral[900],
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          Mis joyas
        </Text>
      </Animated.View>

      {/* Search bar */}
      <View style={{ paddingBottom: 10 }}>
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

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {TYPE_FILTERS.map((filter) => {
          const isActive = activeType === filter.key
          return (
            <TouchableOpacity
              key={String(filter.key)}
              onPress={() => setActiveType(filter.key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: isActive
                  ? isDark ? colors.primary[400] : colors.primary[500]
                  : searchBg,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive
                    ? colors.neutral[50]
                    : isDark ? colors.neutral[300] : colors.neutral[600],
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <AppHeader title="Mis joyas" scrollY={scrollY} expandProgress={sectionProgress} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: labelColor }}>Cargando...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filtered}
          keyExtractor={(item) => item.experience.id}
          renderItem={({ item }) => (
            <SavedExperienceCard
              item={item}
              isDark={isDark}
              onPress={() => router.push(`/saved-experiences/${item.experience.id}`)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            saved.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 64 }}>
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
            ) : isFiltered ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 64 }}>
                <Ionicons name="filter-outline" size={44} color={labelColor} style={{ marginBottom: 16 }} />
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: isDark ? colors.neutral[200] : colors.neutral[700],
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  {activeType
                    ? `Sin joyas de tipo "${activeTypeLabel}"`
                    : `Sin resultados para "${search}"`}
                </Text>
                <TouchableOpacity
                  onPress={() => { setActiveType(null); setSearch('') }}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: isDark ? colors.surface[700] : colors.neutral[200],
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? colors.neutral[200] : colors.neutral[700] }}>
                    Ver todas
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  )
}
