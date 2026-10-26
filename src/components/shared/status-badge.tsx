'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CampaignStatus, SubmissionStatus } from '@/domain/enums';
import { useTranslations } from 'next-intl';
import { getCampaignStatusLabel, getSubmissionStatusLabel } from '@/lib/i18n/enum-presenters';

interface StatusBadgeProps {
  status: CampaignStatus | SubmissionStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tRoles = useTranslations('roles');

  const getVariant = (s: string) => {
    switch (s) {
      case CampaignStatus.DRAFT:
      case SubmissionStatus.DRAFT:
        return 'secondary';
      case CampaignStatus.ACTIVE:
        return 'default';
      case CampaignStatus.COMPLETED:
      case SubmissionStatus.APPROVED:
        return 'success';
      case SubmissionStatus.SUBMITTED:
        return 'warning';
      case SubmissionStatus.NEEDS_REVISION:
        return 'destructive';
      case CampaignStatus.ARCHIVED:
      default:
        return 'outline';
    }
  };

  let label: string = status;
  if (Object.values(CampaignStatus).includes(status as CampaignStatus)) {
    label = getCampaignStatusLabel(status as CampaignStatus, (k: string) => tRoles(k));
  } else if (Object.values(SubmissionStatus).includes(status as SubmissionStatus)) {
    label = getSubmissionStatusLabel(status as SubmissionStatus, (k: string) => tRoles(k));
  }

  return (
    <Badge variant={getVariant(status)} className={className}>
      {label}
    </Badge>
  );
}
