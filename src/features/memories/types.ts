import { z } from 'zod'
import { LIMITS } from '@/config/limits'

export const addMemorySchema = z.object({
  caption: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

export type AddMemoryFormData = z.infer<typeof addMemorySchema>

export type AddMemoryErrorCode =
  | 'LIMIT_REACHED'
  | 'PERMISSION_DENIED'
  | 'NO_IMAGE_SELECTED'
  | 'UPLOAD_FAILED'
  | 'DB_FAILED'

export const PHOTO_LIMIT = LIMITS.MAX_PHOTOS_PER_TRIP
