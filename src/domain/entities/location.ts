export interface Location {
  id: string;
  campaignId: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  assignedSupervisorId?: string | null;
  assignedApproverId?: string | null;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
