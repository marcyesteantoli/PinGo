import { useState, useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useTheme } from '@lib/theme'
import { EASE_OUT, DURATION } from '@lib/animations'
import { cardShadow } from '@lib/shadows'
import { colors } from '@lib/colors'
import type { SavedExperienceItem, Experience } from '@types/index'

const TYPE_ICON: Record<Experience['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  restaurant:    'restaurant-outline',
  entertainment: 'film-outline',
  other:         'ellipse-outline',
}

const TYPE_BG: Record<Experience['type'], string> = {
  transport:     'bg-activity-blue-bg dark:bg-[#061E4E]',
  accommodation: 'bg-activity-purple-bg dark:bg-[#24064E]',
  activity:      'bg-activity-green-bg dark:bg-[#064E3B]',
  restaurant:    'bg-activity-orange-bg dark:bg-[#4E1E06]',
  entertainment: 'bg-activity-pink-bg dark:bg-[#4E062A]',
  other:         'bg-activity-gray-bg dark:bg-[#334155]',
}

const TYPE_ICON_COLOR: Record<Experience['type'], string> = {
  transport:     '#3B82F6',
  accommodation: '#8B5CF6',
  activity:      '#22C55E',
  restaurant:    '#F97316',
  entertainment: '#EC4899',
  other:         '#94A3B8',
}

const ATTR_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Sabor:           'restaurant-outline',
  Precio:          'pricetag-outline',
  Servicio:        'people-outline',
  Ambiente:        'musical-notes-outline',
  Experiencia:     'star-outline',
  Accesibilidad:   'accessibility-outline',
  'Duración':      'time-outline',
  Limpieza:        'sparkles-outline',
  'Ubicación':     'location-outline',
  Comodidad:       'bed-outline',
  Puntualidad:     'alarm-outline',
  Facilidad:       'flash-outline',
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

type Rating = { attribute: string; value: number }

function calcAvgScore(ratings: Rating[]): number | null {
  if (!ratings.length) return null
  const sum = ratings.reduce((acc, r) => acc + r.value, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

function scoreColor(score: number): string {
  if (score >= 7) return '#22C55E'
  if (score >= 4) return '#F59E0B'
  return '#EF4444'
}

function formatScore(score: number): string {
  return parseFloat(score.toFixed(1)).toString()
}

function getScoreLabelKey(score: number): string {
  if (score >= 9) return 'rating_option_perfect'
  if (score >= 7) return 'rating_option_great'
  if (score >= 5) return 'rating_option_good'
  if (score >= 3) return 'rating_option_ok'
  return 'rating_option_bad'
}

// ─── Score badge: tinted circle — coherent with app badge system ─────────────

function ScoreBadge({ ratings, cardIndex }: { ratings: Rating[]; cardIndex: number }) {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const score = calcAvgScore(ratings)
  const hasScore = score !== null

  const base = hasScore ? scoreColor(score) : colors.neutral[300]
  // #RRGGBBAA — 10% bg fill, 30% border, full text color
  const bgColor    = hasScore ? `${base}1A` : (isDark ? colors.surface[700] : colors.neutral[100])
  const borderColor = hasScore ? `${base}4D` : (isDark ? colors.surface[600] : colors.neutral[200])
  const textColor  = hasScore ? base : colors.neutral[400]
  const labelColor = hasScore ? `${base}99` : colors.neutral[400]

  const scale = useSharedValue(0.4)
  const opacity = useSharedValue(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withTiming(1, { duration: DURATION.fast, easing: EASE_OUT })
      opacity.value = withTiming(1, { duration: DURATION.fast, easing: EASE_OUT })
    }, Math.min(cardIndex, 8) * 50 + 180)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        badgeStyle,
        {
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: bgColor,
          borderWidth: 1.5,
          borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
      ]}
    >
      <Text style={{ fontSize: 15, fontWeight: '800', color: textColor, letterSpacing: -0.3 }}>
        {hasScore ? formatScore(score) : '—'}
      </Text>
      {hasScore && (
        <Text style={{ fontSize: 8.5, fontWeight: '600', color: labelColor, marginTop: -1 }}>
          {t(getScoreLabelKey(score))}
        </Text>
      )}
    </Animated.View>
  )
}

// ─── Attribute row: icon + label | animated bar | numeric value ──────────────

function AttributeRow({ attribute, value, delay }: { attribute: string; value: number; delay: number }) {
  const { t } = useTranslation()
  const [trackWidth, setTrackWidth] = useState(0)
  const fillWidth = useSharedValue(0)
  const color = scoreColor(value)
  const icon = ATTR_ICON[attribute] ?? 'ellipse-outline'
  const label = t(`expAttr_label_${attribute}`, attribute)

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }))

  useEffect(() => {
    if (trackWidth <= 0) return
    const target = (value / 10) * trackWidth
    const timer = setTimeout(() => {
      fillWidth.value = withTiming(target, { duration: 480, easing: EASE_OUT })
    }, delay)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackWidth, value, delay])

  return (
    <View className="flex-row items-center gap-2.5">
      {/* Icon + label — fixed width so all bars align */}
      <View className="flex-row items-center gap-1.5" style={{ width: 88 }}>
        <Ionicons name={icon} size={12} color={colors.neutral[400]} />
        <Text numberOfLines={1} className="text-[11.5px] text-neutral-500 dark:text-neutral-400 flex-1">
          {label}
        </Text>
      </View>

      {/* Animated bar */}
      <View
        className="flex-1 h-[4px] rounded-full bg-neutral-200 dark:bg-surface-600 overflow-hidden"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[fillStyle, { backgroundColor: color }]} className="h-full rounded-full" />
      </View>

      {/* Numeric score */}
      <Text style={{ width: 18, color, fontSize: 12, fontWeight: '700', textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface SavedExperienceCardProps {
  item: SavedExperienceItem
  onPress: () => void
  index: number
}

export function SavedExperienceCard({ item, onPress, index }: SavedExperienceCardProps) {
  const { experience, note } = item
  const locationText = getLocationText(experience.location)
  const type = experience.type as Experience['type']
  const ratings = experience.attribute_ratings
  const hasRatings = ratings.length > 0
  const hasFooter = !!(note || experience.trip?.name)
  const accentColor = TYPE_ICON_COLOR[type]

  const staggerStyle = useStaggerEnter(index, { delay: 50 })
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  const baseBarDelay = Math.min(index, 8) * 50 + 280

  return (
    <Animated.View style={[staggerStyle, cardShadow]} className="rounded-2xl">
      <Pressable
        onPress={onPress}
        onPressIn={() => { pressScale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT }) }}
        onPressOut={() => { pressScale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT }) }}
      >
        <Animated.View style={pressStyle} className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden">

          {/* Left type accent stripe */}
          <View
            className="absolute top-0 left-0 bottom-0 w-[3px]"
            style={{ backgroundColor: accentColor, opacity: 0.65 }}
          />

          <View className="pl-5 pr-4 pt-3.5">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <View className="flex-row items-center gap-3">
              <View className={`w-11 h-11 rounded-xl items-center justify-center flex-shrink-0 ${TYPE_BG[type]}`}>
                <Ionicons name={TYPE_ICON[type]} size={22} color={accentColor} />
              </View>

              <View className="flex-1">
                <Text numberOfLines={2} className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-50 leading-snug">
                  {experience.title}
                </Text>
                {locationText && (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Ionicons name="location-outline" size={12} color={colors.neutral[400]} />
                    <Text numberOfLines={1} className="text-[13px] text-neutral-500 dark:text-neutral-400 flex-1">
                      {locationText}
                    </Text>
                  </View>
                )}
              </View>

              <ScoreBadge ratings={ratings} cardIndex={index} />
            </View>

            {/* ── Attribute rows — single column ───────────────────────── */}
            {hasRatings && (
              <View className="mt-3 gap-1.5">
                {ratings.map((r, idx) => (
                  <AttributeRow
                    key={r.attribute}
                    attribute={r.attribute}
                    value={r.value}
                    delay={baseBarDelay + idx * 50}
                  />
                ))}
              </View>
            )}

            {/* ── Footer: note + trip chip ──────────────────────────────── */}
            {hasFooter ? (
              <View className="flex-row items-center justify-between mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-surface-700 pb-3.5">
                {note ? (
                  <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                    <Ionicons name="chatbubble-outline" size={12} color={colors.neutral[400]} />
                    <Text numberOfLines={1} className="text-[13px] text-neutral-500 dark:text-neutral-400 flex-1 italic">
                      {note}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-1" />
                )}

                {experience.trip?.name && (
                  <View className="bg-neutral-100 dark:bg-surface-700 rounded-full px-2.5 py-1 flex-shrink-0">
                    <Text numberOfLines={1} className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {experience.trip.name}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="pb-3.5" />
            )}

          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
