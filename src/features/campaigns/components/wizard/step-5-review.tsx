'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  Store,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  Tag,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

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
      // Chuyển hướng thẳng vào Campaign Workspace vận hành
      router.push(`/campaigns/${campaign.id}`);
    } else {
      setErrorMessage(res.error || 'Lỗi khi kích hoạt chiến dịch');
    }
  };

  const getStepTargetForError = (err: string): { step: number; label: string } => {
    const lower = err.toLowerCase();
    if (lower.includes('checklist') || lower.includes('tiêu chí')) {
      return { step: 3, label: 'Sửa tại Bước 3 (Checklists)' };
    }
    if (lower.includes('supervisor') || lower.includes('approver') || lower.includes('giám sát') || lower.includes('phê duyệt') || lower.includes('nhân sự')) {
      return { step: 4, label: 'Sửa tại Bước 4 (Phân công)' };
    }
    if (lower.includes('địa điểm') || lower.includes('gian hàng') || lower.includes('booth')) {
      return { step: 2, label: 'Sửa tại Bước 2 (Địa điểm)' };
    }
    return { step: 1, label: 'Sửa tại Bước 1 (Thông tin)' };
  };

  const hasErrors = readiness.errors.length > 0;
  const hasWarnings = (readiness.warnings && readiness.warnings.length > 0) || (readiness.stats.boothsWithPendingStaff || 0) > 0;

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
                  Xác nhận & Kích hoạt chiến dịch
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Kiểm tra tính sẵn sàng trước khi đưa chiến dịch vào vận hành chính thức.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Bản nháp (DRAFT)
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Thông tin cốt lõi tóm tắt */}
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-100 bg-white">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Chiến dịch & Nhãn hàng</span>
            <p className="font-bold text-slate-900 text-sm truncate">{campaign.title}</p>
            <p className="text-blue-600 font-medium truncate">{campaign.brandName || 'Chưa đặt brand'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Thời gian vận hành</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
            </div>
            <p className="text-slate-400 text-[11px]">{campaign.companyName}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Quy mô triển khai</span>
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <span>{readiness.stats.totalLocations} địa điểm</span>
              <span>•</span>
              <span>{readiness.stats.totalBooths} gian hàng</span>
            </div>
            <p className="text-emerald-600 font-medium">{readiness.stats.boothsWithChecklist} booth có checklist</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Nhân sự phụ trách</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{readiness.stats.boothsFullyStaffed}/{readiness.stats.totalBooths} booth đủ người</span>
            </div>
            {(readiness.stats.boothsWithPendingStaff || 0) > 0 ? (
              <p className="text-blue-600 font-medium">{readiness.stats.boothsWithPendingStaff} booth chờ xác nhận</p>
            ) : (
              <p className="text-emerald-600 font-medium">Tất cả đã kích hoạt</p>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Màn hình Thẩm định điều kiện (Preflight Validation - Action-Oriented) */}
      <div className="space-y-4">
        {/* A. THÔNG BÁO LỖI CHẶN CỨNG (HARD BLOCKING ERRORS) - Nếu có */}
        {hasErrors && (
          <Card className="border-red-200 bg-red-50/40 shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-red-100 bg-red-50/80">
              <div className="flex items-center gap-2.5 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-900 leading-tight">
                    Cần hoàn thành các điều kiện bắt buộc trước khi kích hoạt ({readiness.errors.length} vấn đề)
                  </h4>
                  <p className="text-xs text-red-600 mt-0.5">
                    Hệ thống tạm khóa nút kích hoạt để đảm bảo toàn vẹn dữ liệu vận hành.
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
                      className="shrink-0 text-xs h-7 px-3 bg-red-600 hover:bg-red-700 text-white font-medium gap-1 self-end sm:self-auto"
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

        {/* B. THÔNG BÁO THÀNH CÔNG NẾU KHÔNG CÓ LỖI (CLEAN STATE) */}
        {!hasErrors && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-emerald-800">
              <h4 className="font-bold text-emerald-950 text-sm">
                Chiến dịch đã vượt qua tất cả điều kiện vận hành bắt buộc
              </h4>
              <p className="mt-1 text-emerald-700 leading-relaxed">
                Tất cả địa điểm ({readiness.stats.totalLocations}), gian hàng ({readiness.stats.totalBooths}), tiêu chí checklist và phân công nhân sự đều hợp lệ. Chiến dịch đã sẵn sàng để chuyển sang trạng thái <strong>Hoạt động (ACTIVE)</strong>.
              </p>
            </div>
          </div>
        )}

        {/* C. CẢNH BÁO MỀM (SOFT WARNINGS: Ví dụ nhân sự PENDING) */}
        {hasWarnings && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5 flex items-start gap-3 shadow-xs">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-blue-900 space-y-1">
              <h4 className="font-bold text-blue-950 text-sm">
                Lưu ý về nhân sự đang chờ xác nhận
              </h4>
              <p className="text-blue-800 leading-relaxed">
                Có <strong>{readiness.stats.boothsWithPendingStaff || 1} gian hàng</strong> được phân công cho nhân sự chưa kích hoạt tài khoản Google. 
                Bạn <strong>vẫn có thể kích hoạt chiến dịch ngay bây giờ</strong> để bắt đầu lịch trình. Tuy nhiên, tính năng nộp bằng chứng tại các booth này sẽ tạm khóa cho đến khi nhân sự đăng nhập chấp nhận lời mời.
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

        {/* E. BẬT/TẮT XEM CHI TIẾT KỸ THUẬT NẾU CẦN */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{showTechnicalDetails ? 'Ẩn bảng chi tiết gian hàng' : 'Xem chi tiết phân bổ từng gian hàng'}</span>
            {showTechnicalDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-4">Địa điểm / Booth</th>
                      <th className="py-2.5 px-4">Checklist</th>
                      <th className="py-2.5 px-4">Supervisor</th>
                      <th className="py-2.5 px-4">Approver</th>
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
                            <span className="text-emerald-600 font-semibold">{b.checklistCount} tiêu chí</span>
                          ) : (
                            <span className="text-red-600 font-bold">Chưa có checklist</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {b.supervisorName ? (
                            b.isSupervisorPending ? (
                              <span className="text-blue-600 font-medium">{b.supervisorName} (⏳)</span>
                            ) : (
                              <span className="text-slate-700">{b.supervisorName}</span>
                            )
                          ) : (
                            <span className="text-amber-600 font-bold">Chưa gán</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {b.approverName ? (
                            b.isApproverPending ? (
                              <span className="text-blue-600 font-medium">{b.approverName} (⏳)</span>
                            ) : (
                              <span className="text-slate-700">{b.approverName}</span>
                            )
                          ) : (
                            <span className="text-amber-600 font-bold">Chưa gán</span>
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

        {/* F. KHỐI HẠN NGẠCH GÓI SAAS (TÁCH RIÊNG XUỐNG DƯỚI) */}
        {subscriptionQuota && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                Gói đăng ký: <strong className="text-slate-900">{subscriptionQuota.planName}</strong> (Đang dùng {subscriptionQuota.activeCampaignCount}/{subscriptionQuota.maxActiveCampaigns} chiến dịch Active)
              </span>
            </div>

            {subscriptionQuota.isAtQuotaLimit ? (
              <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[11px]">
                Đã đạt giới hạn gói
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">
                Còn trống {subscriptionQuota.remainingSlots} chiến dịch
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
          className="w-full sm:w-auto text-xs"
        >
          ← Quay lại Bước 4
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/campaigns')}
            disabled={isActivating}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Lưu nháp & Thoát
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
              'Đang kích hoạt...'
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Kích hoạt chiến dịch ngay
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
