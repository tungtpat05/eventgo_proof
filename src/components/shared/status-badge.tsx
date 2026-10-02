import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CampaignStatus, SubmissionStatus } from '@/domain/enums';

interface StatusBadgeProps {
  status: CampaignStatus | SubmissionStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    // Campaign Statuses
    case CampaignStatus.DRAFT:
      return <Badge variant="secondary">Bản nháp</Badge>;
    case CampaignStatus.ACTIVE:
      return <Badge variant="default">Đang triển khai</Badge>;
    case CampaignStatus.COMPLETED:
      return <Badge variant="success">Hoàn thành</Badge>;
    case CampaignStatus.ARCHIVED:
      return <Badge variant="outline">Đã lưu trữ</Badge>;

    // Submission Statuses
    case SubmissionStatus.DRAFT:
      return <Badge variant="secondary">Chưa nộp</Badge>;
    case SubmissionStatus.SUBMITTED:
      return <Badge variant="warning">Chờ phê duyệt</Badge>;
    case SubmissionStatus.NEEDS_REVISION:
      return <Badge variant="destructive">Cần chỉnh sửa</Badge>;
    case SubmissionStatus.APPROVED:
      return <Badge variant="success">Đã duyệt đạt</Badge>;

    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
