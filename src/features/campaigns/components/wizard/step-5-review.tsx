'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  Store,
  CheckSquare,
  Users,
  Calendar,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Campaign, Location, Booth, ChecklistItem } from '@/domain/entities';
import { SubscriptionQuota } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { WizardFooter } from './wizard-footer';
import { activateCampaignInWizardAction } from '../../actions/campaign-wizard-actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
  }[];
  readiness: {
    canActivate: boolean;
    errors: string[];
    stats: {
      totalLocations: number;
      totalBooths: number;
      boothsWithChecklist: number;
      boothsWithSupervisor: number;
      boothsWithApprover: number;
      boothsFullyStaffed: number;
    };
  };
  subscriptionQuota?: SubscriptionQuota;
  onBack: () => void;
  onGoToStep: (step: number) => void;
}

export function Step5Review({
  campaign,
  locations,
  allBooths,
  readiness,
  subscriptionQuota,
  onBack,
  onGoToStep,
}: Step5ReviewProps) {
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleActivate = async () => {
    setIsActivating(true);
    setErrorMessage(null);

    const res = await activateCampaignInWizardAction(campaign.id);
    setIsActivating(false);

    if (res.success) {
      router.push('/campaigns');
    } else {
      setErrorMessage(res.error || 'Lỗi khi kích hoạt chiến dịch');
    }
  };

  const handleSaveDraftAndExit = () => {
    router.push('/campaigns');
  };

  const checklistCoveragePercent =
    allBooths.length > 0
      ? Math.round((readiness.stats.boothsWithChecklist / allBooths.length) * 100)
      : 0;

  const staffingCoveragePercent =
    allBooths.length > 0
      ? Math.round((readiness.stats.boothsFullyStaffed / allBooths.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Summary Header Card */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                Xem lại & Kích hoạt chiến dịch
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Thẩm định tính sẵn sàng và các tiêu chuẩn kiểm soát trước khi đưa vào vận hành.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 whitespace-pre-line font-medium">
              {errorMessage}
            </div>
          )}

          {/* 4 Summary Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box 1: Thông tin */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Thông tin chiến dịch</span>
                <button
                  type="button"
                  onClick={() => onGoToStep(1)}
                  className="text-blue-600 hover:underline text-[11px]"
                >
                  Sửa
                </button>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">{campaign.title}</p>
              <p className="text-xs text-slate-600 truncate">{campaign.companyName}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                </span>
              </div>
            </div>

            {/* Box 2: Quy mô */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Quy mô triển khai</span>
                <button
                  type="button"
                  onClick={() => onGoToStep(2)}
                  className="text-blue-600 hover:underline text-[11px]"
                >
                  Sửa
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{locations.length}</span>
                <span className="text-xs text-slate-500">địa điểm</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Store className="h-3.5 w-3.5 text-slate-400" />
                <span>{allBooths.length} gian hàng (booth)</span>
              </div>
            </div>

            {/* Box 3: Checklist */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Cấu hình Checklist</span>
                <button
                  type="button"
                  onClick={() => onGoToStep(3)}
                  className="text-blue-600 hover:underline text-[11px]"
                >
                  Sửa
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {readiness.stats.boothsWithChecklist}/{allBooths.length}
                </span>
                <span className="text-xs text-slate-500">booth ({checklistCoveragePercent}%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${checklistCoveragePercent}%` }}
                />
              </div>
            </div>

            {/* Box 4: Nhân sự */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Phân công nhân sự</span>
                <button
                  type="button"
                  onClick={() => onGoToStep(4)}
                  className="text-blue-600 hover:underline text-[11px]"
                >
                  Sửa
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {readiness.stats.boothsFullyStaffed}/{allBooths.length}
                </span>
                <span className="text-xs text-slate-500">booth ({staffingCoveragePercent}%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${staffingCoveragePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRE-FLIGHT VALIDATION CHECKLIST */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-slate-200 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Kiểm tra điều kiện kích hoạt chiến dịch (Pre-flight Inspection)
            </h4>

            <div className="space-y-2.5">
              {/* Check 1: Info */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">
                    Thông tin cơ bản chiến dịch hợp lệ (Tên, khách hàng, ngày triển khai)
                  </span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  Đạt
                </span>
              </div>

              {/* Check 2: Structure */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex items-center gap-2.5">
                  {locations.length > 0 && allBooths.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800">
                    Cấu trúc phân cấp: Có ít nhất 1 địa điểm và mọi địa điểm có booth
                  </span>
                </div>
                {locations.length > 0 && allBooths.length > 0 ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    Đạt
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToStep(2)}
                    className="text-red-600 border-red-200 text-[11px] h-7 px-2"
                  >
                    Bổ sung ở Bước 2
                  </Button>
                )}
              </div>

              {/* Check 3: Checklist */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex items-center gap-2.5">
                  {readiness.stats.boothsWithChecklist === allBooths.length && allBooths.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800">
                    Tiêu chí nghiệm thu: Mọi booth đều có cấu hình checklist tiêu chuẩn
                  </span>
                </div>
                {readiness.stats.boothsWithChecklist === allBooths.length && allBooths.length > 0 ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    Đạt
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToStep(3)}
                    className="text-amber-700 border-amber-300 text-[11px] h-7 px-2"
                  >
                    Bổ sung ở Bước 3
                  </Button>
                )}
              </div>

              {/* Check 4: Staffing */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div className="flex items-center gap-2.5">
                  {readiness.stats.boothsFullyStaffed === allBooths.length && allBooths.length > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800">
                    Phân công nhân sự: Mọi booth được gán đầy đủ Supervisor và Approver
                  </span>
                </div>
                {readiness.stats.boothsFullyStaffed === allBooths.length && allBooths.length > 0 ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    Đạt
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGoToStep(4)}
                    className="text-amber-700 border-amber-300 text-[11px] h-7 px-2"
                  >
                    Bổ sung ở Bước 4
                  </Button>
                )}
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-800 text-xs">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-red-900">Không thể kích hoạt chiến dịch</span>
                  <p className="text-red-700 whitespace-pre-line leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Quota Soft-Lock Upgrade Paywall Banner */}
            {subscriptionQuota?.isAtQuotaLimit ? (
              <div className="rounded-xl border-2 border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 p-5 space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-amber-950">
                        Đã chạm giới hạn gói dịch vụ {subscriptionQuota.planName}
                      </h4>
                      <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                        {subscriptionQuota.activeCampaignCount} / {subscriptionQuota.maxActiveCampaigns} chiến dịch
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      Gói <strong>{subscriptionQuota.planName}</strong> cho phép tối đa{' '}
                      <strong>{subscriptionQuota.maxActiveCampaigns} chiến dịch đang hoạt động</strong> cùng một lúc.
                      Để kích hoạt chiến dịch này, vui lòng nâng cấp gói dịch vụ (Starter hoặc Pro) hoặc chuyển bớt các chiến dịch đang chạy sang trạng thái Hoàn thành.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 pt-1 pl-13">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push('/settings/billing')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-4 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Nâng cấp gói ngay
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraftAndExit}
                    className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100 text-xs h-8"
                  >
                    Lưu bản nháp & Xem danh sách
                  </Button>
                </div>
              </div>
            ) : readiness.canActivate ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Chiến dịch đã đủ điều kiện kích hoạt!</span>
                  <span className="text-emerald-700/90 text-[11px]">
                    Bấm nút "Kích hoạt chiến dịch" để chính thức chuyển sang trạng thái Đang hoạt động
                    (ACTIVE) và mở quyền nộp bài cho Supervisor.
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 text-amber-800 text-xs">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block">Chưa đủ điều kiện kích hoạt chiến dịch</span>
                  <span className="text-amber-700/90 text-[11px]">
                    Bạn có thể bấm "Lưu bản nháp & Thoát" để quay lại hoàn thiện sau, hoặc bấm vào
                    các nút "Bổ sung" ở trên để hoàn tất các điểm còn thiếu.
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Navigation */}
      <WizardFooter
        currentStep={5}
        onBack={onBack}
        onNext={
          readiness.canActivate && !subscriptionQuota?.isAtQuotaLimit
            ? handleActivate
            : undefined
        }
        nextText="Kích hoạt chiến dịch"
        isNextLoading={isActivating}
        showSaveDraft={true}
        onSaveDraft={handleSaveDraftAndExit}
      />
    </div>
  );
}
