import type { Experience } from '@/types'

export const EXPERIENCE_ATTRIBUTES: Record<Experience['type'], string[]> = {
  restaurant:    ['Sabor', 'Precio', 'Servicio', 'Ambiente'],
  activity:      ['Experiencia', 'Precio', 'Accesibilidad', 'Duración'],
  accommodation: ['Limpieza', 'Ubicación', 'Precio', 'Comodidad'],
  transport:     ['Puntualidad', 'Comodidad', 'Precio', 'Facilidad'],
  other:         [],
}
