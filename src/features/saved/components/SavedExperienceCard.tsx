import { useEffect, useRef, useState } from 'react'
import { ImageBackground, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { RadarChart } from '@components/ui/RadarChart'
import { useStaggerEnter } from '@lib/useStaggerEnter'
import { useTheme } from '@lib/theme'
import { EASE_OUT, DURATION } from '@lib/animations'
import { cardShadow } from '@lib/shadows'
import { colors } from '@lib/colors'
import { useToggleSaveExperience } from '@features/saved/hooks/useToggleSaveExperience'
import type { SavedExperienceItem, Experience } from '@types/index'

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_HEIGHT = 150
const ACTION_WIDTH = 72

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


const ARC_SIZE = 52
const ARC_RADIUS = 18
const ARC_STROKE = 3.5
const CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatScore(score: number): string {
  return parseFloat(score.toFixed(1)).toString()
}

// ─── ScoreArc ─────────────────────────────────────────────────────────────────

function ScoreArc({ score, index, isDark }: { score: number | null; index: number; isDark: boolean }) {
  const dashOffset = useSharedValue(CIRCUMFERENCE)

  useEffect(() => {
    if (score === null) return
    const target = CIRCUMFERENCE * (1 - Math.min(score, 10) / 10)
    dashOffset.value = withDelay(
      Math.min(index, 8) * 60,
      withTiming(target, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score])

  const arcColor =
    score === null ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)')
    : score >= 8   ? '#22C55E'
    : score >= 5   ? '#F59E0B'
                   : '#94A3B8'

  const trackColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'
  const textColor = isDark ? '#fff' : colors.neutral[900]
  const subTextColor = isDark ? 'rgba(255,255,255,0.55)' : colors.neutral[400]
  const containerBg = isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.78)'

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }))

  // BG sized to arc outer edge: (ARC_RADIUS + ARC_STROKE/2) * 2 + 6px padding = ~45px
  const BG_SIZE = Math.ceil((ARC_RADIUS + ARC_STROKE / 2) * 2 + 6)

  return (
    <View style={{ width: ARC_SIZE, height: ARC_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background circle fitted to arc visual, not SVG viewbox */}
      <View style={{
        position: 'absolute',
        width: BG_SIZE,
        height: BG_SIZE,
        borderRadius: BG_SIZE / 2,
        backgroundColor: containerBg,
      }} />
      <Svg
        width={ARC_SIZE}
        height={ARC_SIZE}
        style={{ position: 'absolute', top: 0, left: 0, transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={ARC_SIZE / 2}
          cy={ARC_SIZE / 2}
          r={ARC_RADIUS}
          stroke={trackColor}
          strokeWidth={ARC_STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        />
        {score !== null && (
          <AnimatedCircle
            cx={ARC_SIZE / 2}
            cy={ARC_SIZE / 2}
            r={ARC_RADIUS}
            stroke={arcColor}
            strokeWidth={ARC_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            animatedProps={animatedProps}
          />
        )}
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: textColor, fontSize: 12, fontWeight: '800', letterSpacing: -0.3 }}>
          {score !== null ? formatScore(score) : '—'}
        </Text>
        {score !== null && (
          <Text style={{ color: subTextColor, fontSize: 7, fontWeight: '600', marginTop: -1 }}>
            /10
          </Text>
        )}
      </View>
    </View>
  )
}

// ─── Attribute bar ────────────────────────────────────────────────────────────

function AnimatedBar({ value, isDark, index, height = 3, style }: {
  value: number; isDark: boolean; index: number; height?: number; style?: object
}) {
  const barColor = value >= 8 ? '#22C55E' : value >= 5 ? '#F59E0B' : '#94A3B8'
  const barWidth = useSharedValue(0)
  const measured = useRef(false)

  const handleLayout = ({ nativeEvent: { layout: { width: w } } }: { nativeEvent: { layout: { width: number } } }) => {
    if (measured.current || w === 0) return
    measured.current = true
    barWidth.value = withDelay(
      index * 50,
      withTiming(w * (value / 10), { duration: 500, easing: Easing.out(Easing.cubic) })
    )
  }

  const barStyle = useAnimatedStyle(() => ({ width: barWidth.value }))

  return (
    <View
      onLayout={handleLayout}
      style={[
        { height, borderRadius: 2, backgroundColor: isDark ? colors.surface[700] : colors.neutral[200], overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View style={[barStyle, { height: '100%', borderRadius: 2, backgroundColor: barColor }]} />
    </View>
  )
}

function AttributeBar({ label, value, isDark, index }: { label: string; value: number; isDark: boolean; index: number }) {
  const barColor = value >= 8 ? '#22C55E' : value >= 5 ? '#F59E0B' : '#94A3B8'
  const animNum = useSharedValue(0)
  const [displayNum, setDisplayNum] = useState(0)

  useEffect(() => {
    animNum.value = withDelay(
      index * 50,
      withTiming(value, { duration: 500, easing: Easing.out(Easing.cubic) })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useAnimatedReaction(
    () => Math.round(animNum.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplayNum)(current)
    }
  )

  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text numberOfLines={1} style={{ fontSize: 10, color: isDark ? colors.neutral[500] : colors.neutral[400], flex: 1 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: barColor, marginLeft: 4 }}>
          {displayNum}
        </Text>
      </View>
      <AnimatedBar value={value} isDark={isDark} index={index} />
    </View>
  )
}

// ─── Rating row (sheet) ───────────────────────────────────────────────────────

function RatingRow({ rating, isDark, index }: { rating: Rating; isDark: boolean; index: number }) {
  const { t } = useTranslation()
  const barColor = rating.value >= 8 ? '#22C55E' : rating.value >= 5 ? '#F59E0B' : '#94A3B8'
  const animNum = useSharedValue(0)
  const [displayNum, setDisplayNum] = useState(0)

  useEffect(() => {
    animNum.value = withDelay(
      index * 60,
      withTiming(rating.value, { duration: 500, easing: Easing.out(Easing.cubic) })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useAnimatedReaction(
    () => Math.round(animNum.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplayNum)(current)
    }
  )

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ width: 96, fontSize: 12, color: isDark ? colors.neutral[400] : colors.neutral[500] }}>
        {t(`expAttr_label_${rating.attribute}`, rating.attribute)}
      </Text>
      <AnimatedBar value={rating.value} isDark={isDark} index={index} height={4} style={{ flex: 1 }} />
      <Text style={{ width: 18, fontSize: 12, fontWeight: '700', color: barColor, textAlign: 'right' }}>
        {displayNum}
      </Text>
    </View>
  )
}

// ─── Long-press radar preview sheet ───────────────────────────────────────────

function RatingsPreviewSheet({
  visible,
  onClose,
  ratings,
  title,
}: {
  visible: boolean
  onClose: () => void
  ratings: Rating[]
  title: string
}) {
  const { isDark } = useTheme()
  const { t } = useTranslation()

  const attributes = ratings.map((r) => r.attribute)
  const userValues: Record<string, number> = {}
  for (const r of ratings) userValues[r.attribute] = r.value

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} scrollable>
      {ratings.length >= 3 ? (
        <View style={{ alignItems: 'center', paddingBottom: 8 }}>
          <RadarChart
            attributes={attributes}
            userValues={userValues}
            groupAvg={{}}
            isDark={isDark}
          />
          <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
            {ratings.map((r, i) => (
              <RatingRow key={r.attribute} rating={r} isDark={isDark} index={i} />
            ))}
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 15, color: isDark ? colors.neutral[400] : colors.neutral[500], textAlign: 'center' }}>
            {t('saved_preview_noRatings', 'Rate at least 3 attributes to see the chart')}
          </Text>
        </View>
      )}
    </BottomSheet>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface SavedExperienceCardProps {
  item: SavedExperienceItem
  onPress: () => void
  index: number
}

export function SavedExperienceCard({ item, onPress, index }: SavedExperienceCardProps) {
  const { experience, note, coverPhotoUrl } = item

  const type = experience.type as Experience['type']
  const ratings = experience.attribute_ratings
  const locationText = getLocationText(experience.location)
  const { t } = useTranslation()
  const { isDark } = useTheme()

  // Max 4 ratings in 2-col grid: left=[0,2], right=[1,3]
  const displayRatings = ratings.slice(0, 4)
  const leftCol = displayRatings.filter((_, i) => i % 2 === 0)
  const rightCol = displayRatings.filter((_, i) => i % 2 === 1)
  const avgScore = calcAvgScore(ratings)

  // Swipe state
  const [containerWidth, setContainerWidth] = useState(0)
  const translateX = useSharedValue(0)
  const savedX = useSharedValue(0)
  const rowWidth = containerWidth > 0 ? containerWidth + ACTION_WIDTH : undefined
  const cardWidth = containerWidth > 0 ? containerWidth : undefined

  // Photo error fallback
  const [photoError, setPhotoError] = useState(false)
  const showPhoto = !!coverPhotoUrl && !photoError

  // Animations
  const staggerStyle = useStaggerEnter(index, { delay: 50 })
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))
  const cardOpacity = useSharedValue(1)
  const exitStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }))
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))

  // Unsave / delete
  const toggle = useToggleSaveExperience(experience.id)
  function handleUnsave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    cardOpacity.value = withTiming(0, { duration: 200, easing: EASE_OUT })
    setTimeout(() => {
      toggle.mutate(true)
    }, 220)
  }

  // Long-press preview
  const [previewVisible, setPreviewVisible] = useState(false)
  function handleLongPress() {
    if (ratings.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setPreviewVisible(true)
    }
  }

  // Swipe-to-delete gesture
  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => {
      savedX.value = translateX.value
    })
    .onUpdate((e) => {
      translateX.value = Math.min(0, Math.max(-ACTION_WIDTH, savedX.value + e.translationX))
    })
    .onEnd(() => {
      translateX.value = translateX.value < -ACTION_WIDTH / 2
        ? withTiming(-ACTION_WIDTH, { duration: 240, easing: Easing.out(Easing.cubic) })
        : withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
    })

  function closeSwipe() {
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) })
  }

  const contentBg = isDark ? colors.surface[800] : '#fff'

  // Note overlay: dark when on photo or dark mode, light when no photo + light mode
  const noteOverlayDark = isDark || showPhoto
  const noteOverlay = note ? (
    <View style={[styles.noteOverlay, { backgroundColor: noteOverlayDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.80)' }]}>
      <Ionicons name="chatbubble-outline" size={10} color={noteOverlayDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)'} />
      <Text numberOfLines={1} style={[styles.noteText, { color: noteOverlayDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)' }]}>{note}</Text>
    </View>
  ) : null

  return (
    <>
      <Animated.View
        style={[staggerStyle, exitStyle, cardShadow, { borderRadius: 20 }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width
          if (w > 0 && w !== containerWidth) setContainerWidth(w)
        }}
      >
        <View style={{ overflow: 'hidden', borderRadius: 20 }}>
          <Animated.View style={[rowStyle, { flexDirection: 'row', width: rowWidth }]}>
            {/* ── Card body ── */}
            <GestureDetector gesture={pan}>
              <Pressable
                style={{ width: cardWidth, flex: cardWidth === undefined ? 1 : undefined }}
                android_ripple={{ color: 'transparent', borderless: true }}
                onPress={onPress}
                onLongPress={handleLongPress}
                onPressIn={() => {
                  pressScale.value = withTiming(0.97, { duration: DURATION.press, easing: EASE_OUT })
                }}
                onPressOut={() => {
                  pressScale.value = withTiming(1, { duration: DURATION.press, easing: EASE_OUT })
                }}
              >
                <Animated.View style={pressStyle}>
                  {/* ── Image section ── */}
                  <View style={{ height: IMAGE_HEIGHT }}>
                    {showPhoto ? (
                      <ImageBackground
                        source={{ uri: coverPhotoUrl! }}
                        style={{ flex: 1 }}
                        resizeMode="cover"
                        onError={() => setPhotoError(true)}
                      >
                        {noteOverlay}
                        <View style={{ position: 'absolute', top: 10, right: 10 }}>
                          <ScoreArc score={avgScore} index={index} isDark={isDark} />
                        </View>
                      </ImageBackground>
                    ) : (
                      <View className={TYPE_BG[type]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={TYPE_ICON[type]} size={52} color={TYPE_ICON_COLOR[type]} style={{ opacity: 1 }} />
                        {noteOverlay}
                        <View style={{ position: 'absolute', top: 10, right: 10 }}>
                          <ScoreArc score={avgScore} index={index} isDark={isDark} />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* ── Content section ── */}
                  <View style={{ backgroundColor: contentBg, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}>
                    {/* Type chip — only when photo shown (icon in image area already conveys type otherwise) */}
                    {showPhoto && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View className={TYPE_BG[type]} style={styles.typeChip}>
                          <Ionicons name={TYPE_ICON[type]} size={11} color={TYPE_ICON_COLOR[type]} />
                          <Text style={[styles.typeChipText, { color: TYPE_ICON_COLOR[type] }]}>
                            {t(`expType_${type}`)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Title */}
                    <Text numberOfLines={2} style={[styles.title, { color: isDark ? colors.neutral[50] : colors.neutral[900] }]}>
                      {experience.title}
                    </Text>

                    {/* Location */}
                    {locationText && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                        <Ionicons name="location-outline" size={11} color={isDark ? colors.neutral[500] : colors.neutral[400]} />
                        <Text numberOfLines={1} style={{ fontSize: 12, color: isDark ? colors.neutral[400] : colors.neutral[500], flex: 1 }}>
                          {locationText}
                        </Text>
                      </View>
                    )}

                    {/* Attribute bars — 2-col grid */}
                    {displayRatings.length > 0 && (
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                        <View style={{ flex: 1, gap: 8 }}>
                          {leftCol.map((r, i) => (
                            <AttributeBar key={r.attribute} label={r.attribute} value={r.value} isDark={isDark} index={i * 2} />
                          ))}
                        </View>
                        <View style={{ flex: 1, gap: 8 }}>
                          {rightCol.map((r, i) => (
                            <AttributeBar key={r.attribute} label={r.attribute} value={r.value} isDark={isDark} index={i * 2 + 1} />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </Animated.View>
              </Pressable>
            </GestureDetector>

            {/* ── Delete action panel ── */}
            <TouchableOpacity
              onPress={() => { closeSwipe(); handleUnsave() }}
              style={{
                width: ACTION_WIDTH,
                backgroundColor: colors.error,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                {t('common_delete')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Long-press ratings preview */}
      {ratings.length > 0 && (
        <RatingsPreviewSheet
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          ratings={ratings}
          title={experience.title}
        />
      )}
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  noteOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
})
