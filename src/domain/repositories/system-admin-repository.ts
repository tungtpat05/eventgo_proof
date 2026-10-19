import { SystemAdminInvite, SystemAdminInviteStatus, UserProfile } from '../entities';

export interface SystemAdminRepository {
  getAdmins(): Promise<UserProfile[]>;
  getInvites(status?: SystemAdminInviteStatus): Promise<SystemAdminInvite[]>;
  createInvite(email: string, invitedBy: string): Promise<SystemAdminInvite>;
  revokeInvite(inviteId: string): Promise<void>;
  revokeAdminRole(userId: string): Promise<void>;
  isSystemAdmin(userId: string): Promise<boolean>;
}
