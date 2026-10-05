export interface Location {
  id: string;
  campaignId: string;
  name: string;
  address: string;
  city: string;
  supervisorMemberId?: string | null;
  supervisorName?: string | null;
  approverMemberId?: string | null;
  approverName?: string | null;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
