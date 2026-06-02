import { z } from 'zod'
import { i18n } from '@/i18n'

export function buildCreateExpenseSchema() {
  return z.object({
    description: z.string().min(1, i18n.t('validation_required_description')),
    amount: z
      .number({ invalid_type_error: i18n.t('validation_required_amount') })
      .positive(i18n.t('validation_amount_positive')),
    experience_id: z.string().uuid().optional(),
    participant_ids: z.array(z.string().uuid()).min(1, i18n.t('validation_required_participants')),
    payer_id: z.string().uuid().optional(),
  })
}

export type CreateExpenseFormData = z.infer<ReturnType<typeof buildCreateExpenseSchema>>
