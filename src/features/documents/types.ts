import { z } from 'zod'

export const uploadDocumentSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  experience_id: z.string().uuid('Selecciona una experiencia'),
})

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>
