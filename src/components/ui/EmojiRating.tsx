import { Text, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors } from '@lib/colors'
import { RatingFace } from './RatingFace'

const LABELS: Record<number, string> = {
  1: 'Decepcionante', 2: 'Muy malo',
  3: 'Malo', 4: 'Regular',
  5: 'Aceptable', 6: 'Bien',
  7: 'Muy bien', 8: 'Genial',
  9: 'Increíble', 10: 'Perfecto',
}

function getTileColor(n: number): string {
  if (n <= 3) return colors.error ?? '#ef4444'
  if (n <= 6) return '#f59e0b'
  return '#22c55e'
}

function getLevel(rating: number): 1 | 2 | 3 | 4 | 5 {
  if (rating <= 2) return 1
  if (rating <= 4) return 2
  if (rating <= 6) return 3
  if (rating <= 8) return 4
  return 5
}

interface EmojiRatingProps {
  value: number | null
  onChange?: (v: number) => void
  size?: 'sm' | 'md'
}

export function EmojiRating({ value, onChange, size = 'md' }: EmojiRatingProps) {
  if (size === 'sm') {
    if (!value) return null
    const clamped = Math.max(1, Math.min(10, Math.round(value)))
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <RatingFace level={getLevel(clamped)} size={18} color={getTileColor(clamped)} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral[600] }}>
          {Number.isInteger(value) ? value : value.toFixed(1)}
        </Text>
      </View>
    )
  }

  const rounded = value !== null ? Math.round(value) : null

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const selected = rounded === n
          const tileColor = getTileColor(n)
          return (
            <TouchableOpacity
              key={n}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onChange?.(n)
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? tileColor : colors.neutral[100],
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: selected ? '700' : '400',
                  color: selected ? '#ffffff' : colors.neutral[500],
                }}
              >
                {n}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {rounded !== null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <RatingFace level={getLevel(rounded)} size={36} color={getTileColor(rounded)} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.neutral[700] }}>
            {LABELS[rounded]}
          </Text>
        </View>
      )}
    </View>
  )
}
