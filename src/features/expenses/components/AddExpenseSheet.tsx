import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { BottomSheet } from '@components/ui/BottomSheet'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useTripContext } from '@features/trips/TripProvider'
import { ParticipantPicker } from './ParticipantPicker'
import { createExpenseSchema, type CreateExpenseFormData } from '../types'

interface AddExpenseSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: CreateExpenseFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function AddExpenseSheet({ visible, onClose, onSubmit, isLoading, error }: AddExpenseSheetProps) {
  const { collaborators } = useTripContext()

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: { participant_ids: [] },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmitForm = async (data: CreateExpenseFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Nuevo gasto">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="gap-4 pb-4">
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

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Importe (€)"
                  placeholder="0.00"
                  value={value?.toString() ?? ''}
                  onChangeText={(text) => {
                    const num = parseFloat(text.replace(',', '.'))
                    onChange(isNaN(num) ? undefined : num)
                  }}
                  keyboardType="decimal-pad"
                  error={errors.amount?.message}
                />
              )}
            />

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
              <Text className="text-sm text-error text-center">{error}</Text>
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
