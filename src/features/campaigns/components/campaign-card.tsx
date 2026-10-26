'use client';

import React from 'react';
import Link from 'next/link';
import { Campaign } from '@/domain/entities';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Calendar, Tag, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CampaignRole, CampaignStatus } from '@/domain/enums';
import { useTranslations, useLocale } from 'next-intl';
import { getRoleLabel } from '@/lib/i18n/enum-presenters';

interface CampaignCardProps {
  campaign: Campaign;
  locationsCount?: number;
}

export function CampaignCard({ campaign, locationsCount = 0 }: CampaignCardProps) {
  const t = useTranslations('campaigns.card');
  const tRoles = useTranslations('roles');
  const locale = useLocale();

  const isDraft = campaign.status === CampaignStatus.DRAFT;
  const isManager = campaign.currentUserRole === CampaignRole.MANAGER;
  const isSupervisor = campaign.currentUserRole === CampaignRole.SUPERVISOR;
  const isApprover = campaign.currentUserRole === CampaignRole.APPROVER;

  // Quyết định URL và nhãn nút CTA theo ngữ cảnh
  let actionUrl = `/campaigns/${campaign.id}`;
  let actionLabel = t('btnViewDetails');
  let isPrimaryAction = false;

  if (isDraft && isManager) {
    actionUrl = `/campaigns/${campaign.id}/wizard?step=${campaign.wizardStep || 1}`;
    actionLabel = t('btnContinueSetup', { step: campaign.wizardStep || 1 });
    isPrimaryAction = true;
  } else if (isSupervisor) {
    actionUrl = '/campaigns/supervision';
    actionLabel = t('btnOpenSupervision');
  } else if (isApprover) {
    actionUrl = '/campaigns/approvals';
    actionLabel = t('btnApprovalQueue');
  } else if (isManager) {
    actionUrl = `/campaigns/${campaign.id}`;
    actionLabel = t('btnOpenWorkspace');
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200 bg-white flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {campaign.brandName ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              <Tag className="h-3 w-3" />
              {campaign.brandName}
            </div>
          ) : (
            <div />
          )}
          <StatusBadge status={campaign.status} />
        </div>

        <CardTitle className="text-base font-bold text-slate-900 mt-2 line-clamp-1">
          {campaign.title}
        </CardTitle>

        {campaign.description && (
          <CardDescription className="line-clamp-2 text-xs text-slate-500 mt-1 leading-relaxed">
            {campaign.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Badge variant="outline" className="text-[11px] font-medium text-slate-700">
            {getRoleLabel(campaign.currentUserRole, (k) => tRoles(k.replace('roles.', '') as any))}
          </Badge>

          {/* Phân biệt rõ loại tiến độ: Setup vs Runtime */}
          {isDraft ? (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {t('configStep', { step: campaign.wizardStep || 1 })}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {t('operating')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            {formatDate(campaign.startDate, locale)} — {formatDate(campaign.endDate, locale)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
        <span className="text-xs text-slate-500">
          {locationsCount > 0 ? t('locationsCount', { count: locationsCount }) : campaign.companyName || t('noLocations')}
        </span>

        <Link href={actionUrl}>
          <Button
            size="sm"
            className={
              isPrimaryAction
                ? 'text-xs h-8 gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs cursor-pointer'
                : 'text-xs h-8 gap-1 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium cursor-pointer'
            }
            variant={isPrimaryAction ? 'default' : 'outline'}
          >
            {isPrimaryAction && <Sparkles className="h-3.5 w-3.5" />}
            <span>{actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
