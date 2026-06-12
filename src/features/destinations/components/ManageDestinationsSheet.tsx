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
import type { TripDestination } from '@app-types/index'
import type { DestinationFormData } from '../hooks/useUpsertDestination'

interface ManageDestinationsSheetProps {
  visible: boolean
  onClose: () => void
  tripId: string
  tripStartDate: string
  tripEndDate: string
}

function DestinationDateBar({
  tripStart,
  tripEnd,
  destStart,
  destEnd,
}: {
  tripStart: string
  tripEnd: string
  destStart: string
  destEnd: string
}) {
  const ts = new Date(tripStart + 'T00:00:00').getTime()
  const te = new Date(tripEnd + 'T00:00:00').getTime()
  const ds = new Date(destStart + 'T00:00:00').getTime()
  const de = new Date(destEnd + 'T00:00:00').getTime()

  const total = te - ts
  if (total <= 0) return null

  const leftFlex = Math.max(0.001, (ds - ts) / total)
  const activeFlex = Math.max(0.001, (de - ds) / total)
  const rightFlex = Math.max(0.001, 1 - leftFlex - activeFlex)

  return (
    <View className="mt-2 h-1 bg-neutral-100 dark:bg-surface-700 rounded-full overflow-hidden">
      <View className="flex-row h-full">
        <View style={{ flex: leftFlex }} />
        <View style={{ flex: activeFlex, backgroundColor: colors.primary[500] }} />
        <View style={{ flex: rightFlex }} />
      </View>
    </View>
  )
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
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {destinations.map((dest) => (
                <View
                  key={dest.id}
                  className="py-3.5"
                  style={{ borderBottomWidth: 1, borderBottomColor: dividerColor }}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center flex-shrink-0 mt-0.5">
                      <Ionicons name="location" size={16} color={colors.primary[500]} />
                    </View>
                    <TouchableOpacity
                      className="flex-1"
                      onPress={() => handleOpenEdit(dest)}
                      activeOpacity={0.7}
                    >
                      <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50 leading-tight">
                        {dest.name}
                      </Text>
                      <Text className="text-[12px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {[
                          dest.country,
                          `${formatShortDate(dest.start_date, i18n.language)} → ${formatShortDate(dest.end_date, i18n.language)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      <DestinationDateBar
                        tripStart={tripStartDate}
                        tripEnd={tripEndDate}
                        destStart={dest.start_date}
                        destEnd={dest.end_date}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(dest)}
                      className="w-9 h-9 items-center justify-center -mr-1 mt-0.5"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  </View>
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
