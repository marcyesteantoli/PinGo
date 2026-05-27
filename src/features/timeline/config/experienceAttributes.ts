import type { Experience } from '@/types'

export type AttributeConfig = {
  key: string
  emoji: string
  question: string
}

export const EXPERIENCE_ATTRIBUTES: Record<Experience['type'], AttributeConfig[]> = {
  restaurant: [
    { key: 'Sabor',     emoji: '🍽️', question: '¿Qué tal estuvo la comida?' },
    { key: 'Precio',    emoji: '💰', question: '¿Mereció la pena el precio?' },
    { key: 'Servicio',  emoji: '🤝', question: '¿Cómo fue la atención?' },
    { key: 'Ambiente',  emoji: '✨', question: '¿Cómo era el ambiente del lugar?' },
  ],
  activity: [
    { key: 'Experiencia',   emoji: '🎯', question: '¿Qué tal fue la experiencia?' },
    { key: 'Precio',        emoji: '💰', question: '¿Mereció la pena el precio?' },
    { key: 'Accesibilidad', emoji: '♿', question: '¿Era fácil llegar y acceder?' },
    { key: 'Duración',      emoji: '⏱️', question: '¿Fue bien de tiempo?' },
  ],
  accommodation: [
    { key: 'Limpieza',  emoji: '🧹', question: '¿Estaba limpio y ordenado?' },
    { key: 'Ubicación', emoji: '📍', question: '¿Cómo era la ubicación?' },
    { key: 'Precio',    emoji: '💰', question: '¿Mereció la pena el precio?' },
    { key: 'Comodidad', emoji: '🛋️', question: '¿Qué tal la comodidad?' },
  ],
  transport: [
    { key: 'Puntualidad', emoji: '🕐', question: '¿Salió y llegó a tiempo?' },
    { key: 'Comodidad',   emoji: '💺', question: '¿Qué tal la comodidad?' },
    { key: 'Precio',      emoji: '💰', question: '¿Mereció la pena el precio?' },
    { key: 'Facilidad',   emoji: '🎫', question: '¿Fue fácil de gestionar?' },
  ],
  other: [],
}
