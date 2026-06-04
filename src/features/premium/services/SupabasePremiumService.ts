import { supabase } from '@lib/supabase'
import type { PlanId, PremiumPlan, PremiumService } from './PremiumService'

export class SupabasePremiumService implements PremiumService {
  async getStatus(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('is_premium, plan')
      .eq('id', userId)
      .single()

    return {
      isPremium: data?.is_premium ?? false,
      plan: (data?.plan ?? 'free') as PremiumPlan,
    }
  }

  async getTripUnlockStatus(userId: string, tripId: string): Promise<boolean> {
    const { data } = await supabase
      .from('trip_unlocks')
      .select('id')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .maybeSingle()

    return data !== null
  }

  async getTripSharedStatus(tripId: string): Promise<boolean> {
    // Any collaborator bought trip_unlock for this trip?
    const { data: unlock } = await supabase
      .from('trip_unlocks')
      .select('id')
      .eq('trip_id', tripId)
      .limit(1)
      .maybeSingle()

    if (unlock) return true

    // Any collaborator is globally Pro?
    const { data: collabs } = await supabase
      .from('trip_collaborators')
      .select('user_id')
      .eq('trip_id', tripId)

    if (!collabs?.length) return false

    const userIds = collabs.map((c) => c.user_id)
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('id', userIds)
      .eq('is_premium', true)

    return (count ?? 0) > 0
  }

  // No-op until payment gateway is integrated
  async purchase(_planId: PlanId): Promise<void> {}
  async purchaseTripUnlock(_tripId: string): Promise<void> {}
  async restore(): Promise<void> {}
}
