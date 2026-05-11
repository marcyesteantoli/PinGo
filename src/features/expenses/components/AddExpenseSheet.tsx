import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Avatar } from '@components/ui/Avatar'
import { useTripContext } from '@features/trips/TripProvider'
import { ParticipantPicker } from './ParticipantPicker'
import { createExpenseSchema, type CreateExpenseFormData } from '../types'

interface AddExpenseSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: CreateExpenseFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
  currentUserId?: string
}

export function AddExpenseSheet({ visible, onClose, onSubmit, isLoading, error, currentUserId }: AddExpenseSheetProps) {
  const { collaborators } = useTripContext()
  const [amountText, setAmountText] = useState('')

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      participant_ids: [],
      payer_id: currentUserId,
    },
  })

  useEffect(() => {
    if (currentUserId && visible) {
      setValue('payer_id', currentUserId)
    }
  }, [currentUserId, visible, setValue])

  const selectedPayerId = watch('payer_id')

  const handleClose = () => {
    reset({ participant_ids: [], payer_id: currentUserId })
    setAmountText('')
    onClose()
  }

  const handleSubmitForm = async (data: CreateExpenseFormData) => {
    await onSubmit(data)
    reset({ participant_ids: [], payer_id: currentUserId })
    setAmountText('')
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Nuevo gasto">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="gap-5 pb-4">

            {/* Amount - big and prominent */}
            <View className="items-center py-2">
              <Text className="text-xs text-neutral-400 mb-3 uppercase tracking-wide">Importe</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <View className="items-center gap-1">
                    <View className="flex-row items-baseline gap-1">
                      <Text style={{ fontSize: 28, color: '#8d99ae', fontWeight: '300' }}>€</Text>
                      <TextInput
                        placeholder="0,00"
                        placeholderTextColor="#cbd5e1"
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
                          color: '#0f172a',
                          minWidth: 120,
                          textAlign: 'center',
                          borderBottomWidth: 2,
                          borderBottomColor: errors.amount ? '#ef4444' : '#e2e8f0',
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
                  label="Descripción"
                  placeholder="ej. Cena en restaurante"
                  value={value}
                  onChangeText={onChange}
                  error={errors.description?.message}
                />
              )}
            />

            {/* Payer selector */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-neutral-700">¿Quién pagó?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2">
                {collaborators.map((c) => {
                  const isSelected = selectedPayerId === c.user_id
                  return (
                    <TouchableOpacity
                      key={c.user_id}
                      onPress={() => setValue('payer_id', c.user_id)}
                      activeOpacity={0.7}
                      className={`items-center gap-1.5 px-3 py-2.5 rounded-2xl border min-w-16 ${
                        isSelected ? 'border-primary-400 bg-primary-50' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <View style={isSelected ? { borderWidth: 2, borderColor: '#2563eb', borderRadius: 22, padding: 1 } : {}}>
                        <Avatar uri={c.avatar_url} name={c.name} size="sm" />
                      </View>
                      <Text className={`text-xs font-medium text-center max-w-16 ${isSelected ? 'text-primary-700' : 'text-neutral-600'}`} numberOfLines={1}>
                        {c.user_id === currentUserId ? 'Tú' : c.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
              {errors.payer_id && (
                <Text className="text-xs text-error">{errors.payer_id.message}</Text>
              )}
            </View>

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

            {error && (
              <View className="bg-red-50 rounded-xl px-4 py-3">
                <Text className="text-sm text-error text-center">{error}</Text>
              </View>
            )}

            <Button
              onPress={handleSubmit(handleSubmitForm)}
              isLoading={isLoading}
              size="lg"
            >
              Añadir gasto
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  )
}
