import { useEffect } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { RadarChart } from '@components/ui/RadarChart'
import { useAttributeRatings } from '@features/timeline/hooks/useAttributeRatings'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
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

function getScoreIcon(score: number) {
  if (score <= 2) return RATING_ICONS[0]
  if (score <= 4) return RATING_ICONS[1]
  if (score <= 6) return RATING_ICONS[2]
  if (score <= 8) return RATING_ICONS[3]
  return RATING_ICONS[4]
}

interface DotProgressProps {
  value: number
  isDark: boolean
}

function DotProgress({ value, isDark }: DotProgressProps) {
  const filled = Math.round(value)
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: 10 }, (_, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < filled
              ? colors.primary[500]
              : isDark ? colors.surface[600] : colors.neutral[200],
          }}
        />
      ))}
    </View>
  )
}

interface FadeCardProps {
  children: React.ReactNode
  cardKey: string
}

function FadeCard({ children, cardKey }: FadeCardProps) {
  const opacity = useSharedValue(0)
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220 })
  }, [cardKey])

  return (
    <Animated.View style={animStyle}>
      {children}
    </Animated.View>
  )
}

interface AttributeRatingSectionProps {
  experienceId: string
  experienceType: Experience['type']
  cardBg: string
  labelColor: string
  borderColor: string
  onEditPress?: () => void
}

export function AttributeRatingSection({
  experienceId,
  experienceType,
  cardBg,
  labelColor: _labelColor,
  borderColor,
  onEditPress,
}: AttributeRatingSectionProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const attributes = EXPERIENCE_ATTRIBUTES[experienceType]
  const { data } = useAttributeRatings(experienceId)

  if (attributes.length === 0) return null

  const userValues = data?.userValues ?? {}
  const hasAnyUserValue = attributes.some((a) => userValues[a.key] !== undefined)

  const radarKeys = attributes.map((a) => a.key)

  return (
    <FadeCard cardKey={hasAnyUserValue ? 'rated' : 'empty'}>
      {hasAnyUserValue ? (
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <RadarChart
            attributes={radarKeys}
            userValues={userValues}
            groupAvg={{}}
            isDark={isDark}
            showLabels
          />

          <View style={{ borderTopWidth: 0.5, borderTopColor: borderColor, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            {attributes.map((attr) => {
              const score = userValues[attr.key]
              return (
                <View
                  key={attr.key}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{attr.emoji}</Text>
                  <Text
                    style={{ fontSize: 14, fontWeight: '500', color: isDark ? colors.neutral[200] : colors.neutral[800], width: 100 }}
                    numberOfLines={1}
                  >
                    {t(`expAttr_label_${attr.key}` as any)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <DotProgress value={score ?? 0} isDark={isDark} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary[500], width: 20, textAlign: 'right' }}>
                    {score ?? '—'}
                  </Text>
                  {score !== undefined && (
                    <Image source={getScoreIcon(score)} style={{ width: 22, height: 22 }} resizeMode="contain" />
                  )}
                </View>
              )
            })}
          </View>

          <View style={{ borderTopWidth: 0.5, borderTopColor: borderColor }}>
            <TouchableOpacity
              onPress={onEditPress}
              activeOpacity={0.7}
              style={{ paddingVertical: 14, alignItems: 'center' }}
              hitSlop={{ top: 4, bottom: 4 }}
            >
              <Text style={{ fontSize: 15, color: colors.primary[500] }}>
                {t('rating_editCta')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 12,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isDark ? colors.surface[700] : colors.neutral[100],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>⭐</Text>
          </View>

          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: isDark ? colors.neutral[50] : colors.neutral[900],
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            {t('rating_rateTitle')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? colors.neutral[400] : colors.neutral[500],
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {t('rating_rateSubtitle')}
          </Text>

          <TouchableOpacity
            onPress={onEditPress}
            activeOpacity={0.85}
            style={{
              marginTop: 20,
              backgroundColor: colors.primary[500],
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 28,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}>
              {t('rating_startCta')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </FadeCard>
  )
}
