import { SubscriptionPlanTier } from '../enums';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  isSystemAdmin?: boolean;
  plan?: SubscriptionPlanTier | string;
  createdAt: Date;
  updatedAt: Date;
}

