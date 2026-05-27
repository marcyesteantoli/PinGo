import { useRef, useState } from 'react'
import { TextInput, TouchableOpacity, View, Text } from 'react-native'
import { BottomSheet } from '@components/ui/BottomSheet'
import { AttributeRatingSection } from '@features/timeline/components/AttributeRatingSection'
import { useSavedNote } from '@features/saved/hooks/useSavedNote'
import { useUpsertSavedNote } from '@features/saved/hooks/useUpsertSavedNote'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { Experience } from '@types/index'

interface RateExperienceSheetProps {
  visible: boolean
  onClose: () => void
  experienceId: string
  experienceType: Experience['type']
}

export function RateExperienceSheet({ visible, onClose, experienceId, experienceType }: RateExperienceSheetProps) {
  const { isDark } = useTheme()
  const { data: savedNote } = useSavedNote(experienceId)
  const upsertNote = useUpsertSavedNote(experienceId)
  const [noteText, setNoteText] = useState<string | undefined>(undefined)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const cardBg = isDark ? colors.surface[700] : colors.neutral[100]
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const borderColor = isDark ? colors.surface[600] : colors.neutral[200]
  const textColor = isDark ? colors.neutral[50] : colors.neutral[900]
  const placeholderColor = isDark ? colors.neutral[600] : colors.neutral[400]

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Valorar experiencia">
      {/* Note input — before the attributes chart */}
      <View style={{ backgroundColor: cardBg, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: labelColor, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Mi nota
        </Text>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: borderColor }}>
          <TextInput
            value={noteText ?? savedNote ?? ''}
            onChangeText={(text) => {
              setNoteText(text)
              clearTimeout(noteTimer.current)
              noteTimer.current = setTimeout(() => upsertNote.mutate(text), 800)
            }}
            onBlur={() => {
              clearTimeout(noteTimer.current)
              upsertNote.mutate(noteText ?? savedNote ?? '')
            }}
            placeholder="Escribe tu recomendación personal..."
            placeholderTextColor={placeholderColor}
            multiline
            style={{ fontSize: 15, color: textColor, minHeight: 72, textAlignVertical: 'top', padding: 0 }}
          />
        </View>
      </View>

      <AttributeRatingSection
        experienceId={experienceId}
        experienceType={experienceType}
        cardBg={cardBg}
        labelColor={labelColor}
        borderColor={borderColor}
      />

      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.8}
        style={{ marginTop: 8, backgroundColor: colors.primary[500], borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>Listo</Text>
      </TouchableOpacity>
    </BottomSheet>
  )
}
