import { z } from 'zod'
import { i18n } from '@/i18n'

const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/

function buildOptionalTime() {
  return z
    .string()
    .refine((v) => !v || timeRegex.test(v), { message: i18n.t('validation_timeFormat') })
    .optional()
}

export function buildCreateExperienceSchema() {
  return z
    .object({
      title: z.string().min(1, i18n.t('validation_required_title')),
      type: z.enum(['transport', 'accommodation', 'activity', 'restaurant', 'entertainment', 'other']),
      date: z.string().min(1, i18n.t('validation_required_date')),
      start_time: buildOptionalTime(),
      end_time: buildOptionalTime(),
      confirmation_code: z.string().optional(),
      location: z
        .object({ name: z.string(), lat: z.number(), lng: z.number(), city: z.string().optional() })
        .optional(),
      destination_id: z.string().uuid().nullable().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.start_time && data.end_time && data.end_time <= data.start_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t('validation_timeOrder'),
          path: ['end_time'],
        })
      }
    })
}

export type CreateExperienceFormData = z.infer<ReturnType<typeof buildCreateExperienceSchema>>

export type ExperienceType = 'transport' | 'accommodation' | 'activity' | 'restaurant' | 'entertainment' | 'other'

export function formatTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null
  if (!endTime) return startTime
  return `${startTime} – ${endTime}`
}
