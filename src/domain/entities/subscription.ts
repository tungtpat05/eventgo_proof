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
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export const PLAN_CONFIGS: Record<SubscriptionPlanTier, PlanConfig> = {
  [SubscriptionPlanTier.FREE]: {
    tier: SubscriptionPlanTier.FREE,
    name: 'Gói Free',
    priceMonthlyVnd: 0,
    maxActiveCampaigns: 2,
    maxBooths: null,
    maxParticipants: null,
    description: 'Cá nhân hoặc chạy thử nghiệm 1-2 chiến dịch song song',
    features: [
      '2 Chiến dịch hoạt động cùng lúc',
      'Không giới hạn Booths & Người tham gia',
      'Bộ tiêu chí Checklist cơ bản',
    ],
    isPopular: false,
    isActive: true,
  },
  [SubscriptionPlanTier.STARTER]: {
    tier: SubscriptionPlanTier.STARTER,
    name: 'Gói Starter',
    priceMonthlyVnd: 2000,
    maxActiveCampaigns: 5,
    maxBooths: null,
    maxParticipants: null,
    description: 'Dành cho Agency sự kiện vừa & nhỏ chạy đồng thời',
    features: [
      '5 Chiến dịch hoạt động cùng lúc',
      'Không giới hạn Booths & Người tham gia',
      'Thư viện mẫu Checklist chuẩn hóa',
      'Cộng dồn thời gian khi thanh toán sớm',
    ],
    isPopular: true,
    isActive: true,
  },
  [SubscriptionPlanTier.PRO]: {
    tier: SubscriptionPlanTier.PRO,
    name: 'Gói Pro',
    priceMonthlyVnd: 5000,
    maxActiveCampaigns: 20,
    maxBooths: null,
    maxParticipants: null,
    description: 'Agency chuyên nghiệp & Nhãn hàng chạy quy mô lớn',
    features: [
      '20 Chiến dịch hoạt động cùng lúc',
      'Không giới hạn Booths & Người tham gia',
      'Ưu tiên tốc độ xử lý biên bản & đối soát',
      'Hỗ trợ kỹ thuật 24/7',
    ],
    isPopular: false,
    isActive: true,
  },
};

