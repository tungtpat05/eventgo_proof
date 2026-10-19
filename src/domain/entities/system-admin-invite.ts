import { SystemAdminInviteStatus } from '../enums';

export interface SystemAdminInvite {
  id: string;
  email: string;
  invitedBy: string;
  status: SystemAdminInviteStatus;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
