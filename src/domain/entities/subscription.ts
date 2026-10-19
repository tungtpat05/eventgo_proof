import { SubscriptionPlanTier, SubscriptionStatus } from '../enums';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlanTier;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanConfig {
  tier: SubscriptionPlanTier;
  name: string;
  priceMonthlyVnd: number;
  maxActiveCampaigns: number;
  maxBooths: number | null; // null = unlimited
  maxParticipants: number | null; // null = unlimited
  description: string;
}

export const PLAN_CONFIGS: Record<SubscriptionPlanTier, PlanConfig> = {
  [SubscriptionPlanTier.FREE]: {
    tier: SubscriptionPlanTier.FREE,
    name: 'Gói Free',
    priceMonthlyVnd: 0,
    maxActiveCampaigns: 2,
    maxBooths: null,
    maxParticipants: null,
    description: 'Thử nghiệm & Cá nhân chạy 1-2 chiến dịch song song',
  },
  [SubscriptionPlanTier.STARTER]: {
    tier: SubscriptionPlanTier.STARTER,
    name: 'Gói Starter',
    priceMonthlyVnd: 2000,
    maxActiveCampaigns: 5,
    maxBooths: null,
    maxParticipants: null,
    description: 'Agency vừa và nhỏ chạy đến 5 chiến dịch kích hoạt đồng thời',
  },
  [SubscriptionPlanTier.PRO]: {
    tier: SubscriptionPlanTier.PRO,
    name: 'Gói Pro',
    priceMonthlyVnd: 5000,
    maxActiveCampaigns: 20,
    maxBooths: null,
    maxParticipants: null,
    description: 'Agency chuyên nghiệp & Nhãn hàng chạy đến 20 chiến dịch toàn quốc',
  },
};
