import { useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@components/ui/BottomSheet'
import { DestinationForm } from './DestinationForm'
import { useDestinations } from '../hooks/useDestinations'
import { useDeleteDestination } from '../hooks/useDeleteDestination'
import { useUpsertDestination } from '../hooks/useUpsertDestination'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import { formatShortDate } from '@utils/date'
import type { TripDestination } from '@types/index'
import type { DestinationFormData } from '../hooks/useUpsertDestination'

interface ManageDestinationsSheetProps {
  visible: boolean
  onClose: () => void
  tripId: string
  tripStartDate: string
  tripEndDate: string
}

export function ManageDestinationsSheet({
  visible,
  onClose,
  tripId,
  tripStartDate,
  tripEndDate,
}: ManageDestinationsSheetProps) {
  const { t, i18n } = useTranslation()
  const { isDark } = useTheme()
  const [formVisible, setFormVisible] = useState(false)
  const [editingDestination, setEditingDestination] = useState<TripDestination | undefined>(undefined)

  const { data: destinations = [] } = useDestinations(tripId)
  const upsert = useUpsertDestination(tripId)
  const del = useDeleteDestination(tripId)

  useEffect(() => {
    if (!visible) {
      setFormVisible(false)
      setEditingDestination(undefined)
    }
  }, [visible])

  const handleOpenAdd = () => {
    setEditingDestination(undefined)
    setFormVisible(true)
  }

  const handleOpenEdit = (dest: TripDestination) => {
    setEditingDestination(dest)
    setFormVisible(true)
  }

  const handleBackToList = () => {
    setFormVisible(false)
    setEditingDestination(undefined)
  }

  const handleSave = async (data: DestinationFormData) => {
    await upsert.mutateAsync(data)
    handleBackToList()
  }

  const handleDelete = (dest: TripDestination) => {
    Alert.alert(
      t('destinations_deleteTitle'),
      t('destinations_deleteBody', { name: dest.name }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: () => del.mutate(dest.id),
        },
      ]
    )
  }

  const dividerColor = isDark ? colors.surface[700] : colors.neutral[100]

  const sheetTitle = formVisible
    ? editingDestination ? t('destinations_edit') : t('destinations_add')
    : t('destinations_title')

  const handleSheetClose = formVisible ? handleBackToList : onClose

  return (
    <BottomSheet
      visible={visible}
      onClose={handleSheetClose}
      title={sheetTitle}
      scrollable={formVisible}
    >
      {formVisible ? (
        <DestinationForm
          initial={editingDestination}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          onSave={handleSave}
          onCancel={handleBackToList}
          isLoading={upsert.isPending}
          error={upsert.error?.message ?? null}
        />
      ) : (
        <View>
          {destinations.length === 0 ? (
            <View className="py-10 items-center gap-3">
              <Ionicons name="map-outline" size={40} color={colors.neutral[300]} />
              <Text className="text-[14px] text-neutral-400 dark:text-neutral-500 text-center">
                {t('destinations_empty')}
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {destinations.map((dest) => (
                <View
                  key={dest.id}
                  className="flex-row items-center py-3.5 gap-3"
                  style={{ borderBottomWidth: 1, borderBottomColor: dividerColor }}
                >
                  <View className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center">
                    <Ionicons name="location" size={15} color={colors.primary[500]} />
                  </View>
                  <TouchableOpacity
                    className="flex-1"
                    onPress={() => handleOpenEdit(dest)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[15px] font-medium text-neutral-900 dark:text-neutral-50">
                      {dest.name}
                    </Text>
                    <Text className="text-[12px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {formatShortDate(dest.start_date, i18n.language)} → {formatShortDate(dest.end_date, i18n.language)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(dest)}
                    className="w-9 h-9 items-center justify-center -mr-1"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.neutral[400]} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity
            onPress={handleOpenAdd}
            className="flex-row items-center justify-center gap-2 py-3.5 mt-4 mb-2 bg-primary-500 rounded-2xl"
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-[15px] font-semibold text-white">{t('destinations_add')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  )
}
