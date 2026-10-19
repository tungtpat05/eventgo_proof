import { Subscription, SubscriptionPlanTier, SubscriptionStatus, PlanConfig } from '../entities';

export interface SubscriptionRepository {
  getByUserId(userId: string): Promise<Subscription | null>;
  upsert(params: {
    userId: string;
    plan: SubscriptionPlanTier;
    status: SubscriptionStatus;
    expiresAt?: Date | null;
  }): Promise<Subscription>;
  getAll(params?: {
    plan?: SubscriptionPlanTier;
    status?: SubscriptionStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ subscriptions: Subscription[]; total: number }>;
  getPlanConfigs(): Promise<PlanConfig[]>;
  getPlanConfigByTier(tier: SubscriptionPlanTier): Promise<PlanConfig>;
  updatePlanConfig(tier: SubscriptionPlanTier, data: Partial<PlanConfig>): Promise<PlanConfig>;
}

