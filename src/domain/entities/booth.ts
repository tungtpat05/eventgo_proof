import { ChecklistItem } from './checklist-item';

export interface Booth {
  id: string;
  locationId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  deadline?: Date | null;
  supervisorMemberId?: string | null;
  supervisorName?: string | null;
  isInheritedSupervisor?: boolean;
  approverMemberId?: string | null;
  approverName?: string | null;
  checklistCount?: number;
  completedChecklistCount?: number;
  checklistItems?: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}
