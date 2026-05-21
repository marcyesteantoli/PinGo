import { z } from 'zod'

const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/

const optionalTime = z
  .string()
  .refine((v) => !v || timeRegex.test(v), { message: 'Formato HH:MM' })
  .optional()

export const createExperienceSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  type: z.enum(['transport', 'accommodation', 'activity', 'restaurant', 'other']),
  date: z.string().min(1, 'La fecha es obligatoria'),
  start_time: optionalTime,
  end_time: optionalTime,
  confirmation_code: z.string().optional(),
  location: z.object({ name: z.string(), lat: z.number(), lng: z.number() }).optional(),
}).superRefine((data, ctx) => {
  if (data.start_time && data.end_time && data.end_time <= data.start_time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La hora de fin debe ser posterior a la de inicio',
      path: ['end_time'],
    })
  }
})

export type CreateExperienceFormData = z.infer<typeof createExperienceSchema>

export const EXPERIENCE_TYPE_LABELS = {
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  activity: 'Actividad',
  restaurant: 'Gastronomía',
  other: 'Otro',
} as const

export function formatTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null
  if (!endTime) return startTime
  return `${startTime} – ${endTime}`
}
