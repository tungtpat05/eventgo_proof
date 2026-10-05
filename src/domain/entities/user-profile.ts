export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
