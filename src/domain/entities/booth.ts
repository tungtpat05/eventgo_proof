export interface Booth {
  id: string;
  locationId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  deadline?: Date | null;
  supervisorMemberId?: string | null;
  supervisorName?: string | null;
  approverMemberId?: string | null;
  approverName?: string | null;
  checklistCount?: number;
  completedChecklistCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
