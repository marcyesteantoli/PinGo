import { z } from 'zod'

export const createTripSchema = z.object({
  title: z.string().min(1, 'El nombre es obligatorio'),
  start_date: z.string().min(1, 'La fecha de inicio es obligatoria'),
  end_date: z.string().min(1, 'La fecha de fin es obligatoria'),
}).refine((d) => d.end_date >= d.start_date, {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['end_date'],
})

export const joinTripSchema = z.object({
  join_code: z.string().length(6, 'El código debe tener 6 caracteres').toUpperCase(),
})

export type CreateTripFormData = z.infer<typeof createTripSchema>
export type JoinTripFormData = z.infer<typeof joinTripSchema>
