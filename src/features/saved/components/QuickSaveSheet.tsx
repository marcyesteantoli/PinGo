import { useRef, useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { useUpsertSavedMeta } from '@features/saved/hooks/useUpsertSavedMeta'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

interface QuickSaveSheetProps {
  visible: boolean
  onClose: () => void
  experienceId: string
}

export function QuickSaveSheet({ visible, onClose, experienceId }: QuickSaveSheetProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const upsertMeta = useUpsertSavedMeta(experienceId)

  const [priceText, setPriceText] = useState('')
  const priceInputRef = useRef<TextInput>(null)

  function reset() {
    setPriceText('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSkip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    handleClose()
  }

  function handleDone() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const parsed = priceText.trim() === '' ? null : parseInt(priceText.replace(/[^0-9]/g, ''), 10)
    const price_paid = parsed !== null && !isNaN(parsed) ? parsed : null
    if (price_paid !== null) {
      upsertMeta.mutate({ price_paid })
    }
    handleClose()
  }

  const borderColor = isDark ? colors.surface[600] : colors.neutral[200]
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const inputColor = isDark ? colors.neutral[50] : colors.neutral[900]
  const sectionBg = isDark ? colors.surface[700] : colors.neutral[50]

  return (
    <BottomSheet visible={visible} onClose={handleSkip}>
      <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isDark ? colors.surface[700] : `${colors.primary[500]}14`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Ionicons name="bookmark" size={24} color={colors.primary[500]} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? colors.neutral[50] : colors.neutral[900] }}>
            {t('saved_quicksave_title')}
          </Text>
          <Text style={{ fontSize: 14, color: labelColor, marginTop: 3, textAlign: 'center' }}>
            {t('saved_quicksave_subtitle')}
          </Text>
        </View>

        {/* Price section */}
        <View
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor,
            backgroundColor: sectionBg,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: labelColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: 4,
            }}
          >
            {t('saved_detail_priceLabel')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12 }}>
            <Ionicons name="pricetag-outline" size={16} color={labelColor} style={{ marginRight: 8 }} />
            <TextInput
              ref={priceInputRef}
              value={priceText}
              onChangeText={(v) => setPriceText(v.replace(/[^0-9]/g, ''))}
              placeholder={t('saved_detail_pricePlaceholder')}
              placeholderTextColor={isDark ? colors.neutral[600] : colors.neutral[400]}
              keyboardType="numeric"
              returnKeyType="done"
              style={{ flex: 1, fontSize: 15, color: inputColor, padding: 0 }}
            />
          </View>
        </View>

        {/* Done button */}
        <TouchableOpacity
          onPress={handleDone}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.primary[500],
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
            {t('saved_quicksave_done')}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 15, color: labelColor }}>
            {t('saved_quicksave_skip')}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
