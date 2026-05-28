import { z } from 'zod'

export const addWishlistItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['city', 'restaurant', 'activity', 'accommodation', 'entertainment', 'other']),
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    city: z.string().optional(),
  }).optional(),
  note: z.string().optional(),
})

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>
