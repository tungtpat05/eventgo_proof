export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  isSystemAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

