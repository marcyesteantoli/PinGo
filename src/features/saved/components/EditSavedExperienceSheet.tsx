import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { LocationPicker } from '@features/timeline/components/LocationPicker'
import { ExperienceTypePicker } from '@features/timeline/components/ExperienceTypePicker'
import { useUpdateSavedExperienceInfo } from '../hooks/useUpdateSavedExperienceInfo'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { Experience } from '@app-types/index'

interface PickedLocation {
  name: string
  lat: number
  lng: number
  city?: string
}

interface EditSavedExperienceSheetProps {
  visible: boolean
  onClose: () => void
  experienceId: string
  initialTitle: string
  initialType: Experience['type']
  initialLocation: PickedLocation | null
}

export function EditSavedExperienceSheet({ visible, onClose, experienceId, initialTitle, initialType, initialLocation }: EditSavedExperienceSheetProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const updateInfo = useUpdateSavedExperienceInfo(experienceId)

  const [title, setTitle] = useState(initialTitle)
  const [type, setType] = useState<Experience['type']>(initialType)
  const [location, setLocation] = useState<PickedLocation | undefined>(initialLocation ?? undefined)

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle)
      setType(initialType)
      setLocation(initialLocation ?? undefined)
    }
  }, [visible, initialTitle, initialType, initialLocation])

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert(t('saved_title_required_title'), t('saved_title_required_body'))
      return
    }

    updateInfo.mutate(
      { title, type, location },
      {
        onSuccess: () => onClose(),
        onError: () => {
          Alert.alert(t('common_error'), t('saved_save_error_create'))
        },
      }
    )
  }

  const inputBg = isDark ? colors.surface[700] : colors.neutral[100]
  const textColor = isDark ? colors.neutral[50] : colors.neutral[900]
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const placeholderColor = isDark ? colors.neutral[600] : colors.neutral[400]
  const inactiveBorder = isDark ? colors.surface[600] : colors.neutral[200]

  const LABEL_STYLE = {
    fontSize: 13,
    fontWeight: '500' as const,
    color: labelColor,
    marginBottom: 6,
  }

  const SECTION_GAP = 20

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('saved_editSheet_title')} scrollable>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>

        {/* Ubicación */}
        <Text style={LABEL_STYLE}>{t('saved_addSheet_location')}</Text>
        <View style={{ marginBottom: SECTION_GAP }}>
          <LocationPicker
            value={location}
            onChange={(loc) => setLocation(loc ?? undefined)}
          />
        </View>

        {/* Título */}
        <Text style={LABEL_STYLE}>{t('saved_addSheet_title')}</Text>
        <View
          style={{
            backgroundColor: inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: inactiveBorder,
            marginBottom: SECTION_GAP,
          }}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('saved_addSheet_title_placeholder')}
            placeholderTextColor={placeholderColor}
            style={{
              fontSize: 15,
              color: textColor,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
            returnKeyType="done"
          />
        </View>

        {/* Tipo */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <ExperienceTypePicker
            value={type}
            onChange={setType}
            types={['city', 'restaurant', 'accommodation', 'activity', 'entertainment', 'transport', 'other']}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={updateInfo.isPending}
          style={{
            backgroundColor: updateInfo.isPending ? colors.primary[400] : colors.primary[500],
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 52,
          }}
        >
          {updateInfo.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {t('common_save')}
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </BottomSheet>
  )
}
