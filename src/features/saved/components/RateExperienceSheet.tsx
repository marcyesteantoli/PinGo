import { useEffect, useRef, useState } from 'react'
import { Image, ImageSourcePropType, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { BottomSheet } from '@components/ui/BottomSheet'
import { RadarChart } from '@components/ui/RadarChart'
import { useAttributeRatings } from '@features/timeline/hooks/useAttributeRatings'
import { useUpsertAttributeRating } from '@features/timeline/hooks/useUpsertAttributeRating'
import { useUpsertSavedNote } from '@features/saved/hooks/useUpsertSavedNote'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import type { AttributeConfig } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { Experience } from '@types/index'

const RATING_ICONS = [
  require('../../../../assets/images/ratingIcons/1.png'),
  require('../../../../assets/images/ratingIcons/2.png'),
  require('../../../../assets/images/ratingIcons/3.png'),
  require('../../../../assets/images/ratingIcons/4.png'),
  require('../../../../assets/images/ratingIcons/5.png'),
]

const RATING_OPTIONS = [
  { label: 'Malo',     icon: RATING_ICONS[0], value: 2  },
  { label: 'Regular',  icon: RATING_ICONS[1], value: 4  },
  { label: 'Bien',     icon: RATING_ICONS[2], value: 6  },
  { label: 'Genial',   icon: RATING_ICONS[3], value: 8  },
  { label: 'Perfecto', icon: RATING_ICONS[4], value: 10 },
] as const


function getScoreIcon(score: number) {
  if (score <= 2) return RATING_ICONS[0]
  if (score <= 4) return RATING_ICONS[1]
  if (score <= 6) return RATING_ICONS[2]
  if (score <= 8) return RATING_ICONS[3]
  return RATING_ICONS[4]
}

interface RatingButtonProps {
  icon: ImageSourcePropType
  label: string
  value: number
  isSelected: boolean
  onSelect: (value: number) => void
  isDark: boolean
}

function RatingButton({ icon, label, value, isSelected, onSelect, isDark }: RatingButtonProps) {
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={() => onSelect(value)}
        activeOpacity={0.75}
        style={{
          minHeight: 72,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          borderWidth: 2,
          paddingVertical: 10,
          borderColor: isSelected ? colors.primary[500] : (isDark ? colors.surface[600] : colors.neutral[200]),
          backgroundColor: isSelected
            ? (isDark ? colors.surface[700] : colors.neutral[100])
            : 'transparent',
        }}
      >
        <Image source={icon} style={{ width: 32, height: 32 }} resizeMode="contain" />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '500',
            marginTop: 4,
            color: isSelected
              ? colors.primary[500]
              : (isDark ? colors.neutral[400] : colors.neutral[500]),
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

interface SummaryScreenProps {
  attributes: AttributeConfig[]
  mergedValues: Record<string, number>
  isDark: boolean
  noteText: string
  onNoteChange: (text: string) => void
  onNoteBlur: () => void
  onClose: () => void
}

function SummaryScreen({ attributes, mergedValues, isDark, noteText, onNoteChange, onNoteBlur, onClose }: SummaryScreenProps) {
  const radarOpacity = useSharedValue(0)
  const radarStyle = useAnimatedStyle(() => ({ opacity: radarOpacity.value }))

  useEffect(() => {
    radarOpacity.value = withDelay(200, withTiming(1, { duration: 600 }))
  }, [])

  const radarKeys = attributes.map((a) => a.key)

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: isDark ? colors.surface[700] : colors.neutral[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>✓</Text>
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: isDark ? colors.neutral[50] : colors.neutral[900],
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          ¡Valoración guardada!
        </Text>
      </View>

      <Animated.View style={radarStyle}>
        <RadarChart
          attributes={radarKeys}
          userValues={mergedValues}
          groupAvg={{}}
          isDark={isDark}
          showLabels
        />
      </Animated.View>

      <View style={{ marginTop: 8, gap: 2 }}>
        {attributes.map((attr) => {
          const score = mergedValues[attr.key]
          return (
            <View
              key={attr.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: isDark ? colors.surface[700] : colors.neutral[100],
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{attr.emoji}</Text>
              <Text
                style={{ flex: 1, fontSize: 15, fontWeight: '500', color: isDark ? colors.neutral[200] : colors.neutral[800] }}
              >
                {attr.key}
              </Text>
              {score !== undefined ? (
                <>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary[500] }}>
                    {score}/10
                  </Text>
                  <Image source={getScoreIcon(score)} style={{ width: 22, height: 22 }} resizeMode="contain" />
                </>
              ) : (
                <Text style={{ fontSize: 14, color: isDark ? colors.neutral[500] : colors.neutral[400] }}>
                  Omitido
                </Text>
              )}
            </View>
          )
        })}
      </View>

      <View
        style={{
          marginTop: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? colors.surface[600] : colors.neutral[200],
          overflow: 'hidden',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: isDark ? colors.neutral[400] : colors.neutral[500],
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: 4,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Mi nota
        </Text>
        <TextInput
          value={noteText}
          onChangeText={onNoteChange}
          onBlur={onNoteBlur}
          placeholder="Añade una nota personal..."
          placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
          multiline
          style={{
            fontSize: 15,
            color: isDark ? colors.neutral[50] : colors.neutral[900],
            paddingHorizontal: 14,
            paddingBottom: 12,
            minHeight: 64,
            textAlignVertical: 'top',
          }}
        />
      </View>

      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.85}
        style={{
          marginTop: 16,
          backgroundColor: colors.primary[500],
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>Listo</Text>
      </TouchableOpacity>
    </View>
  )
}

interface RateExperienceSheetProps {
  visible: boolean
  onClose: () => void
  experienceId: string
  experienceType: Experience['type']
  initialNote?: string
}

export function RateExperienceSheet({ visible, onClose, experienceId, experienceType, initialNote }: RateExperienceSheetProps) {
  const { isDark } = useTheme()
  const attributes = EXPERIENCE_ATTRIBUTES[experienceType]
  const { data } = useAttributeRatings(experienceId)
  const upsert = useUpsertAttributeRating(experienceId)
  const upsertNote = useUpsertSavedNote(experienceId)

  const [currentStep, setCurrentStep] = useState(0)
  const [localValues, setLocalValues] = useState<Record<string, number>>({})
  const [noteText, setNoteText] = useState(initialNote ?? '')

  const currentAttrKey = attributes[currentStep]?.key
  const selectedInStep = currentAttrKey !== undefined ? localValues[currentAttrKey] : undefined
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const stepOpacity = useSharedValue(1)
  const stepTranslateX = useSharedValue(0)
  const isAdvancing = useRef(false)
  const goingBack = useRef(false)

  useEffect(() => {
    if (visible) {
      setCurrentStep(0)
      setLocalValues(data?.userValues ?? {})
      setNoteText(initialNote ?? '')
    }
  }, [visible])

  useEffect(() => {
    stepOpacity.value = 0
    stepTranslateX.value = goingBack.current ? -20 : 20
    stepOpacity.value = withTiming(1, { duration: 220 })
    stepTranslateX.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) })
    goingBack.current = false
  }, [currentStep])

  const stepStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateX: stepTranslateX.value }],
  }))

  function advanceStep() {
    isAdvancing.current = false
    setCurrentStep((s) => s + 1)
  }

  function prevStep() {
    isAdvancing.current = false
    setCurrentStep((s) => s - 1)
  }

  function handleBack() {
    if (isAdvancing.current || currentStep === 0) return
    isAdvancing.current = true
    goingBack.current = true
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    stepOpacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(prevStep)()
    })
  }

  function handleSelect(attrKey: string, value: number) {
    if (isAdvancing.current) return
    isAdvancing.current = true

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLocalValues((prev) => ({ ...prev, [attrKey]: value }))
    upsert.mutate({ attribute: attrKey, value })

    stepOpacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(advanceStep)()
    })
  }

  function handleSkip() {
    if (isAdvancing.current) return
    isAdvancing.current = true

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    stepOpacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(advanceStep)()
    })
  }

  if (attributes.length === 0) return null

  const isSummary = currentStep >= attributes.length
  const mergedValues = { ...(data?.userValues ?? {}), ...localValues }

  const progressWidth = Math.min(((currentStep + 1) / attributes.length) * 100, 100)

  return (
    <BottomSheet visible={visible} onClose={onClose} scrollable={isSummary}>
      {isSummary ? (
        <SummaryScreen
          attributes={attributes}
          mergedValues={mergedValues}
          isDark={isDark}
          noteText={noteText}
          onNoteChange={(text) => {
            setNoteText(text)
            clearTimeout(noteTimer.current)
            noteTimer.current = setTimeout(() => upsertNote.mutate(text), 800)
          }}
          onNoteBlur={() => {
            clearTimeout(noteTimer.current)
            upsertNote.mutate(noteText)
          }}
          onClose={onClose}
        />
      ) : (
        <View style={{ minHeight: 460, paddingHorizontal: 20, paddingBottom: 28 }}>
          {/* Progress bar + back + skip */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            {currentStep > 0 ? (
              <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={22} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 22 }} />
            )}
            <View
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? colors.surface[600] : colors.neutral[200],
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: colors.primary[500],
                  width: `${progressWidth}%`,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 15, color: isDark ? colors.neutral[400] : colors.neutral[500] }}>
                Omitir
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step content */}
          <Animated.View style={[{ flex: 1, alignItems: 'center' }, stepStyle]}>
            {(() => {
              const attr = attributes[currentStep]

              return (
                <>
                  <Text style={{ fontSize: 64, lineHeight: 72 }}>{attr.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: '700',
                      color: isDark ? colors.neutral[50] : colors.neutral[900],
                      marginTop: 12,
                      textAlign: 'center',
                    }}
                  >
                    {attr.key}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: isDark ? colors.neutral[400] : colors.neutral[500],
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    {attr.question}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 36, width: '100%' }}>
                    {RATING_OPTIONS.map((opt) => (
                      <RatingButton
                        key={opt.value}
                        icon={opt.icon}
                        label={opt.label}
                        value={opt.value}
                        isSelected={selectedInStep === opt.value}
                        onSelect={(v) => handleSelect(attr.key, v)}
                        isDark={isDark}
                      />
                    ))}
                  </View>
                </>
              )
            })()}
          </Animated.View>
        </View>
      )}
    </BottomSheet>
  )
}
