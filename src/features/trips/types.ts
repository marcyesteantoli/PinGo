import { z } from 'zod'
import { i18n } from '@/i18n'

export function buildCreateTripSchema() {
  return z
    .object({
      title: z.string().min(1, i18n.t('validation_required_name')),
      start_date: z.string().min(1, i18n.t('validation_required_startDate')),
      end_date: z.string().min(1, i18n.t('validation_required_endDate')),
      currency: z.string().min(1).default('EUR'),
    })
    .refine((d) => d.end_date >= d.start_date, {
      message: i18n.t('validation_dateOrder'),
      path: ['end_date'],
    })
}

export function buildJoinTripSchema() {
  return z.object({
    join_code: z.string().length(6, i18n.t('validation_code_length')).toUpperCase(),
  })
}

export type CreateTripFormData = z.infer<ReturnType<typeof buildCreateTripSchema>>
export type JoinTripFormData = z.infer<ReturnType<typeof buildJoinTripSchema>>
