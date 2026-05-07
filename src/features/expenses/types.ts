import { z } from 'zod'

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria'),
  amount: z.number({ invalid_type_error: 'El importe es obligatorio' }).positive('El importe debe ser mayor que 0'),
  experience_id: z.string().uuid().optional(),
  participant_ids: z.array(z.string().uuid()).min(1, 'Selecciona al menos un participante'),
})

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>
