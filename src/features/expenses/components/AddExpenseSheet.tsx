import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Avatar } from '@components/ui/Avatar'
import { ExperiencePicker } from '@features/documents/components/ExperiencePicker'
import { ParticipantPicker } from './ParticipantPicker'
import { buildCreateExpenseSchema, type CreateExpenseFormData } from '../types'
import { getCurrencySymbol } from '@utils/currencies'
import { colors } from '@lib/colors'
import { useErrorToast } from '@lib/errorToast'
import type { Collaborator, Experience } from '@types/index'

interface AddExpenseSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: CreateExpenseFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
  currentUserId?: string
  experiences?: Experience[]
  initialData?: CreateExpenseFormData
  collaborators: Collaborator[]
  tripCurrency?: string
}

export function AddExpenseSheet({ visible, onClose, onSubmit, isLoading, error, currentUserId, experiences, initialData, collaborators, tripCurrency = 'EUR' }: AddExpenseSheetProps) {
  const showError = useErrorToast()
  const [amountText, setAmountText] = useState('')
  const isEditMode = !!initialData
  const { t } = useTranslation()

  const schema = useMemo(() => buildCreateExpenseSchema(), [t])

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      participant_ids: [],
      payer_id: currentUserId,
    },
  })

  useEffect(() => {
    if (!visible) return
    if (initialData) {
      reset(initialData)
      setAmountText(String(initialData.amount).replace('.', ','))
    } else {
      reset({ participant_ids: [], payer_id: currentUserId, experience_id: undefined })
      setAmountText('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (error) showError(error)
  }, [error])

  const handleClose = () => {
    reset({ participant_ids: [], payer_id: currentUserId, experience_id: undefined })
    setAmountText('')
    onClose()
  }

  const handleSubmitForm = async (data: CreateExpenseFormData) => {
    await onSubmit(data)
    reset({ participant_ids: [], payer_id: currentUserId, experience_id: undefined })
    setAmountText('')
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={isEditMode ? t('expenses_addSheet_edit') : t('expenses_addSheet_create')}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bottomOffset={16}>
          <View className="gap-5 pb-4">

            {/* Amount - big and prominent */}
            <View className="items-center py-2">
              <Text className="text-[13px] text-neutral-400 mb-3 uppercase tracking-wide">{t('expenses_field_amount')}</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <View className="items-center gap-1">
                    <View className="flex-row items-baseline gap-1">
                      <Text style={{ fontSize: 28, color: colors.neutral[400], fontWeight: '300' }}>{getCurrencySymbol(tripCurrency)}</Text>
                      <TextInput
                        placeholder={t('expenses_field_amount_placeholder')}
                        placeholderTextColor={colors.neutral[300]}
                        value={amountText}
                        onChangeText={(text) => {
                          setAmountText(text)
                          const num = parseFloat(text.replace(',', '.'))
                          onChange(isNaN(num) ? undefined : num)
                        }}
                        keyboardType="decimal-pad"
                        style={{
                          fontSize: 40,
                          fontWeight: '700',
                          color: colors.neutral[900],
                          minWidth: 120,
                          textAlign: 'center',
                          borderBottomWidth: 2,
                          borderBottomColor: errors.amount ? colors.error : colors.neutral[200],
                          paddingBottom: 4,
                        }}
                      />
                    </View>
                    {errors.amount && (
                      <Text className="text-xs text-error">{errors.amount.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Description */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label={t('expenses_field_description')}
                  placeholder={t('expenses_field_description_placeholder')}
                  value={value}
                  onChangeText={onChange}
                  error={errors.description?.message}
                />
              )}
            />

            {/* Experience picker — optional */}
            {experiences && experiences.length > 0 && (
              <Controller
                control={control}
                name="experience_id"
                render={({ field: { onChange, value } }) => (
                  <ExperiencePicker
                    experiences={experiences}
                    value={value}
                    onChange={(id) => onChange(id === value ? undefined : id)}
                  />
                )}
              />
            )}

            {/* Payer selector */}
            <Controller
              control={control}
              name="payer_id"
              render={({ field: { onChange, value } }) => (
                <View className="gap-3">
                  <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('expenses_field_payer')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 px-1" keyboardShouldPersistTaps="handled">
                    {collaborators.map((c) => {
                      const isSelected = value === c.user_id
                      return (
                        <TouchableOpacity
                          key={c.user_id}
                          onPress={() => onChange(c.user_id)}
                          activeOpacity={0.7}
                          className="items-center gap-1.5"
                        >
                          <View style={{
                            borderWidth: 2.5,
                            borderColor: isSelected ? colors.primary[500] : 'transparent',
                            borderRadius: 26,
                            padding: 2,
                          }}>
                            <Avatar uri={c.avatar_url} name={c.name} size="sm" />
                          </View>
                          <Text
                            className={`text-xs text-center max-w-[64px] ${isSelected ? 'text-primary-600 font-semibold' : 'text-neutral-500 font-medium'}`}
                            numberOfLines={1}
                          >
                            {c.user_id === currentUserId ? t('common_youLabel') : c.name.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                  {errors.payer_id && (
                    <Text className="text-xs text-error">{errors.payer_id.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Participants */}
            <Controller
              control={control}
              name="participant_ids"
              render={({ field: { onChange, value } }) => (
                <ParticipantPicker
                  collaborators={collaborators}
                  selectedIds={value ?? []}
                  onChange={onChange}
                  error={errors.participant_ids?.message}
                />
              )}
            />


            <Button
              onPress={handleSubmit(handleSubmitForm)}
              isLoading={isLoading}
              variant="primary"
              size="lg"
            >
              {isEditMode ? t('expenses_addSheet_submitEdit') : t('expenses_addSheet_submitCreate')}
            </Button>
          </View>
      </KeyboardAwareScrollView>
    </BottomSheet>
  )
}
