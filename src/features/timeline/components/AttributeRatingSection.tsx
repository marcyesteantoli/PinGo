import React, { useCallback, useRef, useState } from 'react'
import { PanResponder, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { RadarChart } from '@components/ui/RadarChart'
import { useAttributeRatings } from '@features/timeline/hooks/useAttributeRatings'
import { useUpsertAttributeRating } from '@features/timeline/hooks/useUpsertAttributeRating'
import { EXPERIENCE_ATTRIBUTES } from '@features/timeline/config/experienceAttributes'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { Experience } from '@types/index'

interface AttributeSliderProps {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  isDark: boolean
}

function AttributeSlider({ label, value, onChange, isDark }: AttributeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0)
  const lastEmittedRef = useRef<number | null>(null)

  const getValueFromX = useCallback(
    (x: number): number => {
      if (trackWidth === 0) return 1
      const clamped = Math.max(0, Math.min(trackWidth, x))
      return Math.round((clamped / trackWidth) * 9) + 1
    },
    [trackWidth],
  )

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const v = getValueFromX(e.nativeEvent.locationX)
        if (v !== lastEmittedRef.current) {
          lastEmittedRef.current = v
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onChange(v)
        }
      },
      onPanResponderMove: (e) => {
        const v = getValueFromX(e.nativeEvent.locationX)
        if (v !== lastEmittedRef.current) {
          lastEmittedRef.current = v
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onChange(v)
        }
      },
    }),
  ).current

  const fillPct = value !== undefined ? (value - 1) / 9 : 0
  const thumbVisible = value !== undefined

  const trackBg = isDark ? colors.surface[700] : colors.neutral[200]
  const textColor = isDark ? colors.neutral[200] : colors.neutral[800]
  const mutedColor = isDark ? colors.neutral[600] : colors.neutral[400]

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
      }}
    >
      <Text
        style={{
          width: 84,
          fontSize: 13,
          fontWeight: '500',
          color: textColor,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>

      <View
        style={{ flex: 1, height: 28, justifyContent: 'center' }}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Track */}
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: trackBg,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${fillPct * 100}%`,
              height: '100%',
              backgroundColor: colors.primary[500],
              borderRadius: 2,
            }}
          />
        </View>

        {/* Thumb */}
        {thumbVisible && (
          <View
            style={{
              position: 'absolute',
              left: `${fillPct * 100}%` as unknown as number,
              marginLeft: -11,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.primary[500],
              shadowColor: colors.primary[500],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 4,
              elevation: 3,
            }}
          />
        )}
      </View>

      <Text
        style={{
          width: 22,
          fontSize: 13,
          fontWeight: '700',
          color: thumbVisible ? colors.secondary[400] : mutedColor,
          textAlign: 'right',
        }}
      >
        {value ?? '—'}
      </Text>
    </View>
  )
}

interface AttributeRatingSectionProps {
  experienceId: string
  experienceType: Experience['type']
  cardBg: string
  labelColor: string
  borderColor: string
}

export function AttributeRatingSection({
  experienceId,
  experienceType,
  cardBg,
  labelColor,
  borderColor,
}: AttributeRatingSectionProps) {
  const { isDark } = useTheme()
  const attributes = EXPERIENCE_ATTRIBUTES[experienceType]

  const { data } = useAttributeRatings(experienceId)
  const upsert = useUpsertAttributeRating(experienceId)

  if (attributes.length === 0) return null

  const userValues = data?.userValues ?? {}
  const groupAvg = data?.groupAvg ?? {}
  const count = data?.count ?? 0

  const hasAnyUserValue = attributes.some((a) => userValues[a] !== undefined)
  const hasGroupData = count > 0

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Section header */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: labelColor,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {count > 0 ? `Atributos · ${count} valoración${count !== 1 ? 'es' : ''}` : 'Atributos'}
      </Text>

      {/* Radar chart */}
      {(hasAnyUserValue || hasGroupData) && (
        <View
          style={{
            paddingVertical: 8,
            borderTopWidth: 0.5,
            borderTopColor: borderColor,
          }}
        >
          <RadarChart
            attributes={attributes}
            userValues={userValues}
            groupAvg={groupAvg}
            isDark={isDark}
          />

          {/* Legend */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 20,
              paddingBottom: 4,
            }}
          >
            {hasGroupData && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View
                  style={{
                    width: 12,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: colors.primary[400],
                  }}
                />
                <Text style={{ fontSize: 11, color: labelColor }}>Grupo</Text>
              </View>
            )}
            {hasAnyUserValue && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View
                  style={{
                    width: 12,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: colors.secondary[400],
                  }}
                />
                <Text style={{ fontSize: 11, color: labelColor }}>Tú</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Sliders */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: 4,
          borderTopWidth: 0.5,
          borderTopColor: borderColor,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: labelColor,
            marginBottom: 4,
            marginTop: 8,
          }}
        >
          Tu valoración
        </Text>
        {attributes.map((attr, idx) => (
          <AttributeSlider
            key={attr}
            label={attr}
            value={userValues[attr]}
            isDark={isDark}
            onChange={(v) => upsert.mutate({ attribute: attr, value: v })}
          />
        ))}
      </View>
    </View>
  )
}
