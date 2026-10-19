import { Subscription, SubscriptionPlanTier, SubscriptionStatus } from '../entities';

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
}
