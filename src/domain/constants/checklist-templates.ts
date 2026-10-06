import { ChecklistCategory } from '@/domain/enums';

export interface ChecklistTemplateItemPreset {
  title: string;
  description: string;
  category: ChecklistCategory;
  isRequired: boolean;
  orderIndex: number;
}

export interface ChecklistTemplatePreset {
  id: string;
  code: string;
  name: string;
  description: string;
  items: ChecklistTemplateItemPreset[];
}

export const CHECKLIST_TEMPLATE_PRESETS: ChecklistTemplatePreset[] = [
  {
    id: 'tpl-activation-standard',
    code: 'ACTIVATION_STANDARD',
    name: 'Activation Booth Standard',
    description: 'Mẫu tiêu chuẩn cho gian hàng kích hoạt tại TTTM / Siêu thị',
    items: [
      {
        title: 'Logo đúng vị trí',
        description: 'Logo rõ nét, đúng quy chuẩn góc nhìn và ánh sáng quy định',
        category: ChecklistCategory.BRANDING,
        isRequired: true,
        orderIndex: 1,
      },
      {
        title: 'POSM đầy đủ',
        description: 'Tờ rơi, wobbler, standee đặt đúng vị trí quy định',
        category: ChecklistCategory.POSM,
        isRequired: true,
        orderIndex: 2,
      },
      {
        title: 'Standee đúng mẫu',
        description: 'Standee ngay ngắn, không bị rách, cong hoặc xô lệch',
        category: ChecklistCategory.POSM,
        isRequired: true,
        orderIndex: 3,
      },
      {
        title: 'Booth sạch sẽ',
        description: 'Khu vực quầy gọn gàng, không có rác, bụi bẩn hay đồ dùng thừa',
        category: ChecklistCategory.CONDITION,
        isRequired: true,
        orderIndex: 4,
      },
      {
        title: 'Nhân sự mặc đúng đồng phục',
        description: 'PG/PB mang thẻ tên và đồng phục nhận diện thương hiệu chuẩn',
        category: ChecklistCategory.STAFFING,
        isRequired: false,
        orderIndex: 5,
      },
    ],
  },
  {
    id: 'tpl-sampling-tour',
    code: 'SAMPLING_TOUR',
    name: 'Sampling Tour & Quầy Kệ',
    description: 'Mẫu kiểm tra quầy sampling phát mẫu thử và vệ sinh an toàn thực phẩm',
    items: [
      {
        title: 'Quầy kệ sampling và khay đựng ly',
        description: 'Khu vực quầy sạch sẽ, khay và ly mẫu chuẩn bị sẵn sàng',
        category: ChecklistCategory.STRUCTURE,
        isRequired: true,
        orderIndex: 1,
      },
      {
        title: 'Standee hướng dẫn tham gia',
        description: 'Standee đặt đúng vị trí lối đi dễ thấy nhất',
        category: ChecklistCategory.POSM,
        isRequired: true,
        orderIndex: 2,
      },
      {
        title: 'Vệ sinh an toàn thực phẩm & găng tay',
        description: 'Nhân viên đeo găng tay và khẩu trang khi phát mẫu',
        category: ChecklistCategory.CONDITION,
        isRequired: true,
        orderIndex: 3,
      },
      {
        title: 'Kiểm đếm số lượng quà tặng/mẫu thử',
        description: 'Ghi nhận số lượng mẫu thử đầu ca và cuối ca',
        category: ChecklistCategory.OTHER,
        isRequired: true,
        orderIndex: 4,
      },
    ],
  },
  {
    id: 'tpl-photobooth-event',
    code: 'PHOTOBOOTH_EVENT',
    name: 'Photobooth & Check-in Sự Kiện',
    description: 'Mẫu kiểm tra khu vực chụp ảnh, ánh sáng và minigame tương tác',
    items: [
      {
        title: 'Backdrop photobooth căng phẳng',
        description: 'Backdrop không nhăn, ánh sáng studio đủ sáng',
        category: ChecklistCategory.BRANDING,
        isRequired: true,
        orderIndex: 1,
      },
      {
        title: 'Đạo cụ chụp ảnh (Hashtag cầm tay)',
        description: 'Các hashtag cầm tay đầy đủ theo danh mục duyệt',
        category: ChecklistCategory.POSM,
        isRequired: true,
        orderIndex: 2,
      },
      {
        title: 'Vòng quay may mắn / Minigame tương tác',
        description: 'Bàn game hoạt động tốt, quà tặng phân chia đúng thể lệ',
        category: ChecklistCategory.STRUCTURE,
        isRequired: true,
        orderIndex: 3,
      },
    ],
  },
];
