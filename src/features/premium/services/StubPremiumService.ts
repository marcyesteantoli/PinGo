import type { PlanId, PremiumService } from './PremiumService'

// Dev/testing override. Set isPremium: true to test gated features locally.
export class StubPremiumService implements PremiumService {
  constructor(private readonly _isPremium = false) {}

  async getStatus(_userId: string) {
    return { isPremium: this._isPremium, plan: 'free' as const }
  }

  async getTripUnlockStatus(_userId: string, _tripId: string): Promise<boolean> {
    return this._isPremium
  }

  async getTripSharedStatus(_tripId: string): Promise<boolean> {
    return this._isPremium
  }

  async purchase(_planId: PlanId): Promise<void> {}
  async purchaseTripUnlock(_tripId: string): Promise<void> {}
  async restore(): Promise<void> {}
}
