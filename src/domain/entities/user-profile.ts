import { UserRole } from '@/domain/enums';

export interface UserProfile {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
