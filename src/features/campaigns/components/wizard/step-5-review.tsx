'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Campaign, Location, Booth, ChecklistItem } from '@/domain/entities';
import { SubscriptionQuota } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { activateCampaignInWizardAction } from '../../actions/campaign-wizard-actions';
import { useRouter } from 'next/navigation';
import { cn, formatDate } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface Step5ReviewProps {
  campaign: Campaign;
  locations: (Location & {
    booths: (Booth & { checklistItems: ChecklistItem[] })[];
  })[];
  allBooths: {
    id: string;
    name: string;
    locationName: string;
    checklistCount: number;
    supervisorName?: string | null;
    approverName?: string | null;
    isSupervisorPending?: boolean;
    isApproverPending?: boolean;
  }[];
  readiness: {
    canActivate: boolean;
    errors: string[];
    warnings?: string[];
    stats: {
      totalLocations: number;
      totalBooths: number;
      boothsWithChecklist: number;
      boothsWithSupervisor: number;
      boothsWithApprover: number;
      boothsFullyStaffed: number;
      boothsWithPendingStaff?: number;
    };
  };
  subscriptionQuota?: SubscriptionQuota;
  onBack: () => void;
  onGoToStep: (step: number) => void;
}

export function Step5Review({
  campaign,
  allBooths,
  readiness,
  subscriptionQuota,
  onBack,
  onGoToStep,
}: Step5ReviewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('campaigns.wizard.step5');

  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    setErrorMessage(null);

    const res = await activateCampaignInWizardAction(campaign.id);
    setIsActivating(false);

    if (res.success) {
      router.push(`/campaigns/${campaign.id}`);
    } else {
      setErrorMessage(res.error || 'Failed to activate campaign');
    }
  };

  const getStepTargetForError = (err: string): { step: number; label: string } => {
    const lower = err.toLowerCase();
    if (lower.includes('checklist') || lower.includes('tiêu chí')) {
      return { step: 3, label: t('fixStep3') };
    }
    if (
      lower.includes('supervisor') ||
      lower.includes('approver') ||
      lower.includes('giám sát') ||
      lower.includes('phê duyệt') ||
      lower.includes('nhân sự')
    ) {
      return { step: 4, label: t('fixStep4') };
    }
    if (lower.includes('địa điểm') || lower.includes('gian hàng') || lower.includes('booth') || lower.includes('location')) {
      return { step: 2, label: t('fixStep2') };
    }
    return { step: 1, label: t('fixStep1') };
  };

  const hasErrors = readiness.errors.length > 0;
  const hasWarnings =
    (readiness.warnings && readiness.warnings.length > 0) ||
    (readiness.stats.boothsWithPendingStaff || 0) > 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Tóm tắt chiến dịch */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                  {t('headerTitle')}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {t('headerDesc')}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {t('statusDraft')}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Thông tin cốt lõi tóm tắt */}
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-100 bg-white">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">{t('labelCampaignBrand')}</span>
            <p className="font-bold text-slate-900 text-sm truncate">{campaign.title}</p>
            <p className="text-blue-600 font-medium truncate">{campaign.brandName || t('fallbackNoBrand')}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">{t('labelRuntime')}</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>
                {formatDate(campaign.startDate, locale)} – {formatDate(campaign.endDate, locale)}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">{campaign.companyName}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">{t('labelScale')}</span>
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <span>{t('locationsCount', { count: readiness.stats.totalLocations })}</span>
              <span>•</span>
              <span>{t('boothsCount', { count: readiness.stats.totalBooths })}</span>
            </div>
            <p className="text-emerald-600 font-medium">
              {t('boothsWithChecklistCount', { count: readiness.stats.boothsWithChecklist })}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">{t('labelStaffing')}</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>
                {t('boothsFullyStaffedCount', {
                  assigned: readiness.stats.boothsFullyStaffed,
                  total: readiness.stats.totalBooths,
                })}
              </span>
            </div>
            {(readiness.stats.boothsWithPendingStaff || 0) > 0 ? (
              <p className="text-blue-600 font-medium">
                {t('boothsPendingStaffCount', { count: readiness.stats.boothsWithPendingStaff || 0 })}
              </p>
            ) : (
              <p className="text-emerald-600 font-medium">{t('allStaffActive')}</p>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Màn hình Thẩm định điều kiện (Preflight Validation) */}
      <div className="space-y-4">
        {/* A. THÔNG BÁO LỖI CHẶN CỨNG (HARD BLOCKING ERRORS) */}
        {hasErrors && (
          <Card className="border-red-200 bg-red-50/40 shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-red-100 bg-red-50/80">
              <div className="flex items-center gap-2.5 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-900 leading-tight">
                    {t('blockingErrorsHeading', { count: readiness.errors.length })}
                  </h4>
                  <p className="text-xs text-red-600 mt-0.5">
                    {t('blockingErrorsSub')}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-2.5">
              {readiness.errors.map((err, idx) => {
                const target = getStepTargetForError(err);
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-red-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-start gap-2 text-red-800">
                      <span className="font-bold text-red-600 mt-0.5">•</span>
                      <span className="font-medium">{err}</span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onGoToStep(target.step)}
                      className="shrink-0 text-xs h-7 px-3 bg-red-600 hover:bg-red-700 text-white font-medium gap-1 self-end sm:self-auto cursor-pointer"
                    >
                      <span>{target.label}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* B. THÔNG BÁO THÀNH CÔNG NẾU KHÔNG CÓ LỖI */}
        {!hasErrors && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-emerald-800">
              <h4 className="font-bold text-emerald-950 text-sm">
                {t('cleanStateHeading')}
              </h4>
              <p className="mt-1 text-emerald-700 leading-relaxed">
                {t('cleanStateDesc', {
                  locations: readiness.stats.totalLocations,
                  booths: readiness.stats.totalBooths,
                })}
              </p>
            </div>
          </div>
        )}

        {/* C. CẢNH BÁO MỀM (Nhân sự PENDING) */}
        {hasWarnings && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5 flex items-start gap-3 shadow-xs">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-blue-900 space-y-1">
              <h4 className="font-bold text-blue-950 text-sm">
                {t('warningStaffHeading')}
              </h4>
              <p className="text-blue-800 leading-relaxed">
                {t('warningStaffDesc', {
                  count: readiness.stats.boothsWithPendingStaff || 1,
                })}
              </p>
            </div>
          </div>
        )}

        {/* D. THÔNG BÁO LỖI SERVER ACTION NẾU CÓ */}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium whitespace-pre-line">{errorMessage}</span>
          </div>
        )}

        {/* E. BẬT/TẮT XEM CHI TIẾT KỸ THUẬT */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{showTechnicalDetails ? t('hideBoothTable') : t('showBoothTable')}</span>
            {showTechnicalDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-4">{t('thLocationBooth')}</th>
                      <th className="py-2.5 px-4">{t('thChecklist')}</th>
                      <th className="py-2.5 px-4">{t('thSupervisor')}</th>
                      <th className="py-2.5 px-4">{t('thApprover')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBooths.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-800">
                          {b.locationName} — {b.name}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-600">
                          {b.checklistCount > 0 ? (
                            <span className="text-emerald-600 font-semibold">
                              {t('boothsWithChecklistCount', { count: b.checklistCount })}
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold">{t('noChecklist')}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {b.supervisorName ? (
                            b.isSupervisorPending ? (
                              <span className="text-blue-600 font-medium">
                                {b.supervisorName} ({t('pendingBadge')})
                              </span>
                            ) : (
                              <span className="text-slate-700">{b.supervisorName}</span>
                            )
                          ) : (
                            <span className="text-amber-600 font-bold">{t('unassigned')}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {b.approverName ? (
                            b.isApproverPending ? (
                              <span className="text-blue-600 font-medium">
                                {b.approverName} ({t('pendingBadge')})
                              </span>
                            ) : (
                              <span className="text-slate-700">{b.approverName}</span>
                            )
                          ) : (
                            <span className="text-amber-600 font-bold">{t('unassigned')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* F. KHỐI HẠN NGẠCH GÓI SAAS */}
        {subscriptionQuota && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                {t('quotaInfo', {
                  planName: subscriptionQuota.planName,
                  used: subscriptionQuota.activeCampaignCount,
                  max: subscriptionQuota.maxActiveCampaigns,
                })}
              </span>
            </div>

            {subscriptionQuota.isAtQuotaLimit ? (
              <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[11px]">
                {t('quotaLimitReached')}
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">
                {t('quotaRemaining', { count: subscriptionQuota.remainingSlots })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer Navigation & CTA Chính */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200 bg-white">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isActivating}
          className="w-full sm:w-auto text-xs cursor-pointer"
        >
          {t('btnBack')}
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/campaigns')}
            disabled={isActivating}
            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {t('btnSaveDraftAndExit')}
          </Button>

          <Button
            type="button"
            disabled={hasErrors || isActivating || Boolean(subscriptionQuota?.isAtQuotaLimit)}
            onClick={handleActivate}
            className={cn(
              'w-full sm:w-auto gap-2 text-xs font-semibold px-6 h-10 shadow-md cursor-pointer transition-all',
              hasErrors || Boolean(subscriptionQuota?.isAtQuotaLimit)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            )}
          >
            {isActivating ? (
              t('activating')
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('btnActivateNow')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
