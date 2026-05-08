import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']
export type TripCollaborator = Database['public']['Tables']['trip_collaborators']['Row']
export type Experience = Database['public']['Tables']['experiences']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row']
export type ExperienceRating = Database['public']['Tables']['experience_ratings']['Row']
export type Memory = Database['public']['Tables']['memories']['Row']

export type ExperienceRatingAvg = Database['public']['Views']['experience_ratings_avg']['Row']

export type TripRole = 'owner' | 'member'

// Tipos compuestos usados en la app
export type TripWithCollaborators = Trip & {
  collaborators: Array<TripCollaborator & { profile: Profile }>
}

export type Collaborator = {
  user_id: string
  name: string
  avatar_url: string | null
  role: TripRole
}

export type ExpenseWithSplits = Expense & {
  splits: ExpenseSplit[]
  payer: Profile
}

export type ExperienceWithRating = Experience & {
  rating_avg: number | null
  rating_count: number
}

// Balance calculado por usuario en un viaje
export type UserBalance = {
  user_id: string
  name: string
  avatar_url: string | null
  paid: number
  owes: number
  balance: number // positivo = le deben, negativo = debe
}
