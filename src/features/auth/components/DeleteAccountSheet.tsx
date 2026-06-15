import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { useDeleteAccount } from '../hooks/useDeleteAccount'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'

interface DeleteAccountSheetProps {
  visible: boolean
  onClose: () => void
}

export function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const deleteAccount = useDeleteAccount()

  const iconColor = isDark ? colors.neutral[400] : colors.neutral[500]

  const items: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'exit-outline', text: t('profile_deleteAccount_sheet_item_trips') },
    { icon: 'eye-off-outline', text: t('profile_deleteAccount_sheet_item_profile') },
    { icon: 'lock-closed-outline', text: t('profile_deleteAccount_sheet_item_permanent') },
  ]

  const handleConfirm = () => {
    deleteAccount.mutate(undefined, {
      onError: () => {
        Alert.alert(t('common_error'), t('profile_deleteAccount_error'))
      },
    })
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
        <View
          className="self-start rounded-2xl items-center justify-center mb-4"
          style={{ width: 48, height: 48, backgroundColor: `${colors.error}1a` }}
        >
          <Ionicons name="person-remove-outline" size={24} color={colors.error} />
        </View>

        <Text className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          {t('profile_deleteAccount_sheet_title')}
        </Text>
        <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 mb-4">
          {t('profile_deleteAccount_sheet_description')}
        </Text>

        <View className="gap-3 mb-6">
          {items.map((item) => (
            <View key={item.icon} className="flex-row items-center gap-3">
              <Ionicons name={item.icon} size={18} color={iconColor} />
              <Text className="flex-1 text-[15px] text-neutral-700 dark:text-neutral-300">
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={deleteAccount.isPending}
          style={{
            backgroundColor: colors.error,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 52,
            opacity: deleteAccount.isPending ? 0.7 : 1,
          }}
        >
          {deleteAccount.isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {t('profile_deleteAccount_sheet_confirm')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          disabled={deleteAccount.isPending}
          className="items-center justify-center mt-2"
          style={{ paddingVertical: 14, minHeight: 52 }}
        >
          <Text className="text-[16px] font-semibold text-neutral-700 dark:text-neutral-300">
            {t('common_cancel')}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
