import { z } from 'zod';

export const locationSchema = z.object({
  campaignId: z.string().min(1, 'Vui lòng chọn chiến dịch'),
  name: z.string().min(2, 'Tên địa điểm / gian hàng không được để trống'),
  address: z.string().min(3, 'Địa chỉ cụ thể không được để trống'),
  city: z.string().min(2, 'Thành phố không được để trống'),
  assignedSupervisorId: z.string().optional().nullable(),
  assignedApproverId: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export type LocationInput = z.infer<typeof locationSchema>;
