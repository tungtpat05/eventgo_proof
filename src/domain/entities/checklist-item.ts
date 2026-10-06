import { ChecklistCategory } from '@/domain/enums';

export interface ChecklistItem {
  id: string;
  boothId: string;
  title: string;
  description?: string | null;
  category: ChecklistCategory;
  isRequired: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}
