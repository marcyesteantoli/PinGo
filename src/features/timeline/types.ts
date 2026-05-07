import { z } from 'zod'

export const createExperienceSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  type: z.enum(['transport', 'accommodation', 'activity', 'restaurant', 'other']),
  date: z.string().min(1, 'La fecha es obligatoria'),
  time_slot: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  confirmation_code: z.string().optional(),
  location: z.object({ name: z.string(), lat: z.number(), lng: z.number() }).optional(),
})

export type CreateExperienceFormData = z.infer<typeof createExperienceSchema>

export const TIME_SLOT_LABELS = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
  night: 'Madrugada',
} as const

export const EXPERIENCE_TYPE_LABELS = {
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  activity: 'Actividad',
  restaurant: 'Restaurante',
  other: 'Otro',
} as const
