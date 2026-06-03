import type { Experience } from '@/types'

export type AttributeConfig = {
  key: string
  emoji: string
  ionIcon: string
  question: string
}

export const EXPERIENCE_ATTRIBUTES: Record<Experience['type'], AttributeConfig[]> = {
  restaurant: [
    { key: 'Sabor',     emoji: '🍽️', ionIcon: 'restaurant-outline',   question: '¿Qué tal estuvo la comida?' },
    { key: 'Precio',    emoji: '💰', ionIcon: 'pricetag-outline',      question: '¿Mereció la pena el precio?' },
    { key: 'Servicio',  emoji: '🤝', ionIcon: 'people-outline',        question: '¿Cómo fue la atención?' },
    { key: 'Ambiente',  emoji: '✨', ionIcon: 'wine-outline',           question: '¿Cómo era el ambiente del lugar?' },
  ],
  activity: [
    { key: 'Experiencia',   emoji: '🎯', ionIcon: 'trophy-outline',        question: '¿Qué tal fue la experiencia?' },
    { key: 'Precio',        emoji: '💰', ionIcon: 'pricetag-outline',       question: '¿Mereció la pena el precio?' },
    { key: 'Accesibilidad', emoji: '♿', ionIcon: 'accessibility-outline',  question: '¿Era fácil llegar y acceder?' },
    { key: 'Duración',      emoji: '⏱️', ionIcon: 'time-outline',           question: '¿Fue bien de tiempo?' },
  ],
  accommodation: [
    { key: 'Limpieza',  emoji: '🧹', ionIcon: 'brush-outline',      question: '¿Estaba limpio y ordenado?' },
    { key: 'Ubicación', emoji: '📍', ionIcon: 'location-outline',   question: '¿Cómo era la ubicación?' },
    { key: 'Precio',    emoji: '💰', ionIcon: 'pricetag-outline',   question: '¿Mereció la pena el precio?' },
    { key: 'Comodidad', emoji: '🛋️', ionIcon: 'bed-outline',        question: '¿Qué tal la comodidad?' },
  ],
  transport: [
    { key: 'Puntualidad', emoji: '🕐', ionIcon: 'alarm-outline',     question: '¿Salió y llegó a tiempo?' },
    { key: 'Comodidad',   emoji: '💺', ionIcon: 'body-outline',       question: '¿Qué tal la comodidad?' },
    { key: 'Precio',      emoji: '💰', ionIcon: 'pricetag-outline',   question: '¿Mereció la pena el precio?' },
    { key: 'Facilidad',   emoji: '🎫', ionIcon: 'flash-outline',      question: '¿Fue fácil de gestionar?' },
  ],
  entertainment: [
    { key: 'Experiencia',  emoji: '🎭', ionIcon: 'star-outline',           question: '¿Qué tal fue la experiencia?' },
    { key: 'Precio',       emoji: '💰', ionIcon: 'pricetag-outline',        question: '¿Mereció la pena el precio?' },
    { key: 'Ambiente',     emoji: '✨', ionIcon: 'musical-notes-outline',   question: '¿Cómo era el ambiente?' },
    { key: 'Duración',     emoji: '⏱️', ionIcon: 'time-outline',            question: '¿Fue bien de tiempo?' },
  ],
  other: [],
}
