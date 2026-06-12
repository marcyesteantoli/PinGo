import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { LocationPicker } from '@features/timeline/components/LocationPicker'
import { ExperienceTypePicker } from '@features/timeline/components/ExperienceTypePicker'
import { useCreateStandaloneSavedExperience } from '../hooks/useCreateStandaloneSavedExperience'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { Experience } from '@app-types/index'

interface PickedLocation {
  name: string
  lat: number
  lng: number
  city?: string
}

interface AddSavedExperienceSheetProps {
  visible: boolean
  onClose: () => void
}

export function AddSavedExperienceSheet({ visible, onClose }: AddSavedExperienceSheetProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const createItem = useCreateStandaloneSavedExperience()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<Experience['type']>('transport')
  const [location, setLocation] = useState<PickedLocation | undefined>()
  const [note, setNote] = useState('')
  const [price, setPrice] = useState('')

  function reset() {
    setTitle('')
    setType('restaurant')
    setLocation(undefined)
    setNote('')
    setPrice('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert(t('saved_title_required_title'), t('saved_title_required_body'))
      return
    }

    const price_paid = price.trim() ? Math.round(Number(price.replace(',', '.'))) : null

    createItem.mutate(
      { title, type, location, note, price_paid },
      {
        onSuccess: () => { reset(); onClose() },
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
    <BottomSheet visible={visible} onClose={handleClose} title={t('saved_addSheet_create')} scrollable>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>

        {/* Ubicación */}
        <Text style={LABEL_STYLE}>{t('saved_addSheet_location')}</Text>
        <View style={{ marginBottom: SECTION_GAP }}>
          <LocationPicker
            value={location}
            onChange={(loc) => {
              setLocation(loc ?? undefined)
              if (loc && !title.trim()) {
                setTitle(loc.name)
              }
            }}
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
            returnKeyType="next"
          />
        </View>

        {/* Tipo */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <ExperienceTypePicker value={type} onChange={setType} />
        </View>

        {/* Precio pagado */}
        <Text style={LABEL_STYLE}>{t('saved_addSheet_price')}</Text>
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
            value={price}
            onChangeText={setPrice}
            placeholder={t('saved_addSheet_price_placeholder')}
            placeholderTextColor={placeholderColor}
            keyboardType="numeric"
            style={{
              fontSize: 15,
              color: textColor,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          />
        </View>

        {/* Nota */}
        <Text style={LABEL_STYLE}>{t('saved_addSheet_note')}</Text>
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
            value={note}
            onChangeText={setNote}
            placeholder={t('saved_addSheet_note_placeholder')}
            placeholderTextColor={placeholderColor}
            multiline
            style={{
              fontSize: 15,
              color: textColor,
              paddingVertical: 12,
              paddingHorizontal: 14,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={createItem.isPending}
          style={{
            backgroundColor: createItem.isPending ? colors.primary[400] : colors.primary[500],
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 52,
          }}
        >
          {createItem.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {t('saved_addSheet_submit')}
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </BottomSheet>
  )
}
