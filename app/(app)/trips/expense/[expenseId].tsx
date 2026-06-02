import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useExpenses } from '@features/expenses/hooks/useExpenses'
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense'
import { useUpdateExpense } from '@features/expenses/hooks/useUpdateExpense'
import { useExperiences } from '@features/timeline/hooks/useExperiences'
import { AddExpenseSheet } from '@features/expenses/components/AddExpenseSheet'
import { Avatar } from '@components/ui/Avatar'
import { queryKeys } from '@lib/queryKeys'
import { colors } from '@lib/colors'
import { cardShadow } from '@lib/shadows'
import { useTheme } from '@lib/theme'
import { formatCurrency } from '@utils/currency'
import { formatDate } from '@utils/date'
import type { Collaborator, Trip, TripRole } from '@types/index'
import type { CreateExpenseFormData } from '@features/expenses/types'

type ExpenseCategory = 'restaurant' | 'transport' | 'accommodation' | 'activity' | 'entertainment' | 'other'

function getExpenseCategory(description: string, experienceType?: ExpenseCategory | null): ExpenseCategory {
  if (experienceType) return experienceType
  const lower = description.toLowerCase()
  if (/cena|comida|restaurante|desayuno|almuerzo|café|cafe|bar|pizza|sushi|gastro/.test(lower)) return 'restaurant'
  if (/taxi|uber|bus|metro|vuelo|tren|gasolina|peaje|coche|transport|billete|ferry/.test(lower)) return 'transport'
  if (/hotel|airbnb|hostel|alojamiento|habitación|piso|apartamento|check/.test(lower)) return 'accommodation'
  if (/entrada|museo|tour|actividad|excursión|concierto|parque|ticket|visita/.test(lower)) return 'activity'
  return 'other'
}

const CATEGORY_ICON: Record<ExpenseCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  restaurant:    'restaurant-outline',
  transport:     'airplane-outline',
  accommodation: 'bed-outline',
  activity:      'compass-outline',
  entertainment: 'film-outline',
  other:         'wallet-outline',
}

const CATEGORY_BG: Record<ExpenseCategory, string> = {
  restaurant:    'bg-activity-orange-bg dark:bg-[#4E1E06]',
  transport:     'bg-activity-blue-bg dark:bg-[#061E4E]',
  accommodation: 'bg-activity-purple-bg dark:bg-[#24064E]',
  activity:      'bg-activity-green-bg dark:bg-[#064E3B]',
  entertainment: 'bg-activity-pink-bg dark:bg-[#4E062A]',
  other:         'bg-activity-gray-bg dark:bg-[#334155]',
}

const CATEGORY_ICON_COLOR: Record<ExpenseCategory, string> = {
  restaurant:    '#F97316',
  transport:     '#3B82F6',
  accommodation: '#8B5CF6',
  activity:      '#22C55E',
  entertainment: '#EC4899',
  other:         '#94A3B8',
}


type RawCollaboratorRow = {
  user_id: string
  role: TripRole
  profiles: { name: string; avatar_url: string | null } | null
}

type TripCacheData = {
  trip: Trip | null
  collaborators: RawCollaboratorRow[]
  userId: string | null
}

export default function ExpenseDetailScreen() {
  const { expenseId, tripId } = useLocalSearchParams<{ expenseId: string; tripId: string }>()
  const router = useRouter()
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()

  const { data: expenses, isLoading } = useExpenses(tripId)
  const { data: experiences } = useExperiences(tripId)
  const deleteExpense = useDeleteExpense(tripId)

  const cachedTripData = queryClient.getQueryData<TripCacheData>(queryKeys.collaborators.byTrip(tripId))
  const tripCurrency = cachedTripData?.trip?.currency ?? 'EUR'
  const collaborators: Collaborator[] = (cachedTripData?.collaborators ?? []).map((c) => ({
    user_id: c.user_id,
    name: c.profiles?.name ?? '',
    avatar_url: c.profiles?.avatar_url ?? null,
    role: c.role,
  }))

  const updateExpense = useUpdateExpense(tripId, collaborators)
  const [editSheetVisible, setEditSheetVisible] = useState(false)

  const expense = expenses?.find((e) => e.id === expenseId)

  const handleDelete = () => {
    if (!expense) return
    Alert.alert(
      t('common_delete'),
      t('wishlist_delete_body', { name: expense.description }),
      [
        { text: t('common_cancel'), style: 'cancel' },
        {
          text: t('common_delete'),
          style: 'destructive',
          onPress: () => deleteExpense.mutate(expense.id, { onSuccess: () => router.back() }),
        },
      ]
    )
  }

  const handleEditSubmit = async (data: CreateExpenseFormData) => {
    if (!expense) return
    await updateExpense.mutateAsync({ expenseId: expense.id, formData: data })
    setEditSheetVisible(false)
  }

  if (isLoading || !expense) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 items-center justify-center -ml-1"
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
        {!isLoading && !expense && (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t('expenseDetail_notFound')}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm font-medium text-primary-500">{t('common_back')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    )
  }

  const isCurrentUserPayer = expense.payer_id === currentUser?.id
  const category = getExpenseCategory(expense.description, expense.experience?.type as ExpenseCategory | null)

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-9 h-9 items-center justify-center -ml-1"
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-semibold text-neutral-900 dark:text-neutral-50"
          style={{ marginLeft: -36 }}
        >
          {t('expenseDetail_title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          className="bg-white dark:bg-surface-800 rounded-2xl p-5 mt-2 items-center gap-3"
          style={cardShadow}
        >
          <View className={`w-16 h-16 rounded-2xl items-center justify-center ${CATEGORY_BG[category]}`}>
            <Ionicons name={CATEGORY_ICON[category]} size={32} color={CATEGORY_ICON_COLOR[category]} />
          </View>
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 text-center">
            {expense.description}
          </Text>
          <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            {formatCurrency(expense.amount, tripCurrency)}
          </Text>
        </View>

        {/* Info */}
        <View
          className="mt-4 bg-white dark:bg-surface-800 rounded-2xl overflow-hidden"
          style={cardShadow}
        >
          <View className="flex-row items-center px-4 py-3.5 gap-3">
            <Ionicons name="calendar-outline" size={18} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
            <Text className="flex-1 text-sm text-neutral-500 dark:text-neutral-400">{t('expenseDetail_field_date')}</Text>
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {formatDate(expense.created_at)}
            </Text>
          </View>

          <View className="bg-neutral-100 dark:bg-surface-700" style={{ height: 0.5, marginLeft: 46 }} />

          <View className="flex-row items-center px-4 py-3.5 gap-3">
            <Ionicons name="person-outline" size={18} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
            <Text className="flex-1 text-sm text-neutral-500 dark:text-neutral-400">{t('expenseDetail_field_paidBy')}</Text>
            <View className="flex-row items-center gap-2">
              <Avatar uri={expense.payer.avatar_url} name={expense.payer.name} size="sm" />
              <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {isCurrentUserPayer ? t('common_youLabel') : expense.payer.name.split(' ')[0]}
              </Text>
            </View>
          </View>

          {expense.experience && expense.experience_id && (
            <>
              <View className="bg-neutral-100 dark:bg-surface-700" style={{ height: 0.5, marginLeft: 46 }} />
              <TouchableOpacity
                className="flex-row items-center px-4 py-3.5 gap-3 active:opacity-70"
                onPress={() => router.push({
                  pathname: '/(app)/trips/experience/[experienceId]' as never,
                  params: { experienceId: expense.experience_id, tripId },
                })}
              >
                <Ionicons name="compass-outline" size={18} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
                <Text className="flex-1 text-sm text-neutral-500 dark:text-neutral-400">{t('expenseDetail_field_experience')}</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50" numberOfLines={1} style={{ maxWidth: 160 }}>
                    {expense.experience.title}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary[500]} />
                </View>
              </TouchableOpacity>
            </>
          )}

          <View className="bg-neutral-100 dark:bg-surface-700" style={{ height: 0.5, marginLeft: 46 }} />

          <View className="flex-row items-center px-4 py-3.5 gap-3">
            <Ionicons name="cash-outline" size={18} color={isDark ? colors.neutral[400] : colors.neutral[500]} />
            <Text className="flex-1 text-sm text-neutral-500 dark:text-neutral-400">{t('expenseDetail_field_currency')}</Text>
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {tripCurrency}
            </Text>
          </View>
        </View>

        {/* Participants */}
        {expense.splits.length > 0 && (
          <View className="mt-4">
            <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
              {t('expenseDetail_participants', { count: expense.splits.length })}
            </Text>
            <View
              className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden"
              style={cardShadow}
            >
              {expense.splits.map((split, idx) => {
                const collaborator = collaborators.find((c) => c.user_id === split.user_id)
                const isPayer = split.user_id === expense.payer_id
                const isMe = split.user_id === currentUser?.id
                const name = collaborator?.name ?? (isPayer ? expense.payer.name : t('common_someone'))
                const avatarUrl = collaborator?.avatar_url ?? (isPayer ? expense.payer.avatar_url : null)

                return (
                  <View key={split.user_id}>
                    {idx > 0 && (
                      <View className="bg-neutral-100 dark:bg-surface-700" style={{ height: 0.5, marginLeft: 60 }} />
                    )}
                    <View className="flex-row items-center px-4 py-3.5">
                      <Avatar uri={avatarUrl} name={name} size="md" />
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {isMe ? t('common_youLabel') : name.split(' ')[0]}
                        </Text>
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatCurrency(split.amount, tripCurrency)}
                        </Text>
                      </View>
                      {isPayer && (
                        <View className="flex-row items-center gap-1 bg-blue-100 dark:bg-blue-900/30 rounded-full px-2 py-0.5">
                          <Ionicons name="card-outline" size={10} color="#3b82f6" />
                          <Text className="text-xs text-blue-600 dark:text-blue-400">{t('expenseDetail_paidBadge')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions — solo para el pagador */}
      {isCurrentUserPayer && (
        <View
          className="px-5 pt-3 pb-4 flex-row gap-3 bg-neutral-100 dark:bg-surface-900 border-neutral-100 dark:border-surface-700"
          style={{ borderTopWidth: 0.5 }}
        >
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleteExpense.isPending}
            className="flex-1 h-12 rounded-xl border items-center justify-center flex-row gap-2"
            style={{ borderColor: colors.error }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={{ color: colors.error }} className="text-sm font-semibold">{t('common_delete')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEditSheetVisible(true)}
            className="flex-1 h-12 rounded-xl bg-primary-500 items-center justify-center flex-row gap-2"
          >
            <Ionicons name="pencil-outline" size={18} color={colors.white} />
            <Text className="text-sm font-semibold text-white">{t('common_edit')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddExpenseSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        onSubmit={handleEditSubmit}
        isLoading={updateExpense.isPending}
        error={updateExpense.error?.message}
        currentUserId={currentUser?.id}
        collaborators={collaborators}
        experiences={experiences ?? []}
        initialData={{
          description: expense.description,
          amount: expense.amount,
          payer_id: expense.payer_id,
          experience_id: expense.experience_id ?? undefined,
          participant_ids: expense.splits.map((s) => s.user_id),
        }}
      />
    </SafeAreaView>
  )
}
