import { z } from 'zod';
import { CampaignStatus } from '@/domain/enums';

export const campaignSchema = z.object({
  title: z.string().min(3, 'Tên chiến dịch phải có ít nhất 3 ký tự'),
  brandName: z.string().min(2, 'Tên nhãn hàng/thương hiệu không được để trống'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  status: z.nativeEnum(CampaignStatus).default(CampaignStatus.DRAFT),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'Ngày kết thúc phải diễn ra sau hoặc cùng ngày với ngày bắt đầu',
  path: ['endDate'],
});

export type CampaignInput = z.infer<typeof campaignSchema>;
