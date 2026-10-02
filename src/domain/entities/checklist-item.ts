import { ChecklistCategory } from '@/domain/enums';

export interface ChecklistItem {
  id: string;
  campaignId: string;
  title: string;
  description?: string | null;
  category: ChecklistCategory;
  isRequired: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}
