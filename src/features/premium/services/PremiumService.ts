export type PlanId = 'pro_monthly' | 'pro_annual' | 'trip_unlock'
export type PremiumPlan = 'free' | PlanId

export type PremiumStatus = {
  isPremium: boolean
  plan: PremiumPlan
  isLoading: boolean
}

export interface PremiumService {
  getStatus(userId: string): Promise<Omit<PremiumStatus, 'isLoading'>>
  getTripUnlockStatus(userId: string, tripId: string): Promise<boolean>
  /** Returns true if ANY collaborator in the trip has a trip_unlock or is Pro. */
  getTripSharedStatus(tripId: string): Promise<boolean>
  purchase(planId: PlanId): Promise<void>
  purchaseTripUnlock(tripId: string): Promise<void>
  restore(): Promise<void>
}
