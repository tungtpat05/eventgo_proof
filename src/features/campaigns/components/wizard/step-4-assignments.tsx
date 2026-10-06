'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Users,
  MapPin,
  Store,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Campaign, Location, Booth, CampaignMember } from '@/domain/entities';
import { WizardFooter } from './wizard-footer';
import {
  assignBoothPersonnelInWizardAction,
  cascadeLocationSupervisorInWizardAction,
} from '../../actions/campaign-wizard-actions';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Step4AssignmentsProps {
  campaign: Campaign;
  locations: (Location & {
    booths: (Booth & {
      isInheritedSupervisor?: boolean;
    })[];
  })[];
  supervisors: CampaignMember[];
  approvers: CampaignMember[];
  onBack: () => void;
  onNext: () => void;
  onAutoSaveNotify?: () => void;
}

export function Step4Assignments({
  campaign,
  locations,
  supervisors,
  approvers,
  onBack,
  onNext,
  onAutoSaveNotify,
}: Step4AssignmentsProps) {
  const router = useRouter();
  const [loadingBoothId, setLoadingBoothId] = useState<string | null>(null);

  // Calculate missing personnel count
  let missingStaffCount = 0;
  locations.forEach((loc) => {
    loc.booths.forEach((b) => {
      if (!b.supervisorMemberId || !b.approverMemberId) {
        missingStaffCount++;
      }
    });
  });

  // 1. Phân công từng booth
  const handleAssignBooth = async (
    boothId: string,
    supId: string | null,
    appId: string | null
  ) => {
    setLoadingBoothId(boothId);
    const res = await assignBoothPersonnelInWizardAction(campaign.id, boothId, supId, appId);
    setLoadingBoothId(null);

    if (res.success) {
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Lỗi khi phân công');
    }
  };

  // 2. Kế thừa Supervisor cấp địa điểm
  const handleCascadeLocation = async (
    locationId: string,
    supervisorMemberId: string,
    applyToAll: boolean
  ) => {
    if (!supervisorMemberId) return;

    const res = await cascadeLocationSupervisorInWizardAction(
      campaign.id,
      locationId,
      supervisorMemberId,
      applyToAll
    );

    if (res.success) {
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Lỗi khi áp dụng kế thừa');
    }
  };

  const handleNextCheck = () => {
    if (missingStaffCount > 0) {
      const confirmProceed = confirm(
        `Hiện còn ${missingStaffCount} booth chưa được phân công đủ Supervisor hoặc Approver. Bạn có muốn tiếp tục sang bước Xem lại & Kiểm tra điều kiện không?`
      );
      if (!confirmProceed) return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Main Assignment Card */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        {/* Card Header */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                  Phân công nhân sự
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Supervisor có thể được kế thừa từ địa điểm hoặc tùy chỉnh theo booth.
                </CardDescription>
              </div>
            </div>

            {/* Warning Banner if missing staff */}
            {missingStaffCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{missingStaffCount} booth thiếu nhân sự</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {locations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              Chưa có địa điểm nào được tạo. Vui lòng quay lại Bước 2 để thêm địa điểm và gian hàng.
            </div>
          ) : (
            locations.map((loc) => {
              return (
                <div
                  key={loc.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs space-y-0"
                >
                  {/* Location Header with Cascading Controls */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 text-blue-600 shadow-2xs">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{loc.name}</h4>
                          <span className="rounded-full bg-slate-200/80 px-2 py-0.2 text-[10px] font-bold text-slate-600">
                            {loc.booths.length} booth
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{loc.address}</p>
                      </div>
                    </div>

                    {/* Cascading Supervisor Dropdown & Checkbox */}
                    <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Supervisor tại địa điểm:
                        </span>
                        <select
                          defaultValue={loc.defaultSupervisorMemberId || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleCascadeLocation(loc.id, e.target.value, true);
                            }
                          }}
                          className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">-- Chọn Supervisor cấp địa điểm --</option>
                          {supervisors.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName} ({s.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span>Áp dụng cho tất cả booth tại địa điểm này</span>
                      </label>
                    </div>
                  </div>

                  {/* Booths Assignment Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5 px-4">Địa điểm / Booth</th>
                          <th className="py-2.5 px-4">Supervisor</th>
                          <th className="py-2.5 px-4">Approver</th>
                          <th className="py-2.5 px-4">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loc.booths.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                              Chưa có booth nào trong địa điểm này.
                            </td>
                          </tr>
                        ) : (
                          loc.booths.map((b) => {
                            const isInherited = b.isInheritedSupervisor;
                            const hasSupervisor = Boolean(b.supervisorMemberId);
                            const hasApprover = Boolean(b.approverMemberId);
                            const isFullyStaffed = hasSupervisor && hasApprover;

                            return (
                              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                {/* Cột 1: Booth Name + Badge Kế thừa */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className="font-semibold text-slate-800">{b.name}</span>
                                    {isInherited && (
                                      <span className="rounded-full px-2 py-0.2 text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        Kế thừa
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Cột 2: Supervisor Dropdown */}
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <select
                                    value={b.supervisorMemberId || ''}
                                    onChange={(e) =>
                                      handleAssignBooth(
                                        b.id,
                                        e.target.value || null,
                                        b.approverMemberId || null
                                      )
                                    }
                                    disabled={loadingBoothId === b.id}
                                    className={cn(
                                      'h-8 rounded-md px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors',
                                      !hasSupervisor
                                        ? 'border-amber-400 bg-amber-50/40 text-amber-800 font-medium'
                                        : 'border-slate-200 bg-white text-slate-800'
                                    )}
                                  >
                                    <option value="">+ Chọn Supervisor</option>
                                    {supervisors.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.fullName}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Cột 3: Approver Dropdown */}
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <select
                                    value={b.approverMemberId || ''}
                                    onChange={(e) =>
                                      handleAssignBooth(
                                        b.id,
                                        b.supervisorMemberId || null,
                                        e.target.value || null
                                      )
                                    }
                                    disabled={loadingBoothId === b.id}
                                    className={cn(
                                      'h-8 rounded-md px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors',
                                      !hasApprover
                                        ? 'border-amber-400 bg-amber-50/40 text-amber-800 font-medium'
                                        : 'border-slate-200 bg-white text-slate-800'
                                    )}
                                  >
                                    <option value="">+ Chọn Approver</option>
                                    {approvers.map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.fullName}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Cột 4: Trạng thái */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                  {isFullyStaffed ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      <span>Đủ nhân sự</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                      <span>
                                        {!hasSupervisor && !hasApprover
                                          ? 'Thiếu cả 2 vai trò'
                                          : !hasSupervisor
                                          ? 'Thiếu Supervisor'
                                          : 'Thiếu Approver'}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}

          {/* Pro-tip Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-800">Mẹo:</strong> Phân công tại cấp địa điểm giúp tiết kiệm
              thời gian. Bạn vẫn có thể ghi đè (override) người phụ trách riêng biệt cho từng booth.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Navigation */}
      <WizardFooter currentStep={4} onBack={onBack} onNext={handleNextCheck} />
    </div>
  );
}
