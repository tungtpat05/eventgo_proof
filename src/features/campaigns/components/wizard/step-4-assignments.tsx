'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  MapPin,
  Store,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserPlus,
  Search,
  Check,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Campaign, Location, Booth, CampaignMember } from '@/domain/entities';
import { WizardFooter } from './wizard-footer';
import {
  assignBoothPersonnelInWizardAction,
  batchAssignLocationPersonnelInWizardAction,
} from '../../actions/campaign-wizard-actions';
import { QuickInviteModal } from './quick-invite-modal';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CampaignRole } from '@/domain/enums';
import { WizardPersonnelOption } from '@/application/use-cases/campaigns/get-campaign-wizard-data';

interface Step4AssignmentsProps {
  campaign: Campaign;
  locations: (Omit<Location, 'booths'> & {
    booths: Booth[];
  })[];
  supervisors: WizardPersonnelOption[];
  approvers: WizardPersonnelOption[];
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
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    locations[0]?.id || ''
  );
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [loadingBoothId, setLoadingBoothId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [defaultInviteRole, setDefaultInviteRole] = useState<CampaignRole>(CampaignRole.SUPERVISOR);

  // Batch assign local state for the active location
  const [batchSupervisorId, setBatchSupervisorId] = useState<string>('');
  const [batchApproverId, setBatchApproverId] = useState<string>('');
  const [isBatchApplying, setIsBatchApplying] = useState(false);

  // 1. Overall stats calculation
  let totalBoothsCount = 0;
  let fullyStaffedCount = 0;
  let missingStaffCount = 0;
  let pendingStaffCount = 0;

  locations.forEach((loc) => {
    loc.booths.forEach((b) => {
      totalBoothsCount++;
      const hasSup = Boolean(b.supervisorMemberId);
      const hasApp = Boolean(b.approverMemberId);
      const isPending = b.isSupervisorPending || b.isApproverPending;

      if (hasSup && hasApp) {
        fullyStaffedCount++;
        if (isPending) pendingStaffCount++;
      } else {
        missingStaffCount++;
        if (isPending) pendingStaffCount++;
      }
    });
  });

  // Filtered locations on left sidebar
  const filteredLocations = useMemo(() => {
    if (!searchLocationQuery.trim()) return locations;
    const q = searchLocationQuery.toLowerCase().trim();
    return locations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
    );
  }, [locations, searchLocationQuery]);

  // Active location object
  const activeLocation = useMemo(() => {
    return locations.find((l) => l.id === selectedLocationId) || locations[0] || null;
  }, [locations, selectedLocationId]);

  // Handlers
  const handleAssignBooth = async (
    boothId: string,
    supId: string | null,
    appId: string | null
  ) => {
    // If user clicked "+ Mời nhân sự..."
    if (supId === '__INVITE_NEW__') {
      setDefaultInviteRole(CampaignRole.SUPERVISOR);
      setIsInviteModalOpen(true);
      return;
    }
    if (appId === '__INVITE_NEW__') {
      setDefaultInviteRole(CampaignRole.APPROVER);
      setIsInviteModalOpen(true);
      return;
    }

    setLoadingBoothId(boothId);
    const res = await assignBoothPersonnelInWizardAction(campaign.id, boothId, supId, appId);
    setLoadingBoothId(null);

    if (res.success) {
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Lỗi khi phân công nhân sự');
    }
  };

  const handleApplyBatchLocation = async () => {
    if (!activeLocation) return;
    if (!batchSupervisorId && !batchApproverId) {
      alert('Vui lòng chọn ít nhất một Supervisor hoặc Approver để áp dụng hàng loạt.');
      return;
    }

    setIsBatchApplying(true);
    const res = await batchAssignLocationPersonnelInWizardAction(
      campaign.id,
      activeLocation.id,
      batchSupervisorId || null,
      batchApproverId || null
    );
    setIsBatchApplying(false);

    if (res.success) {
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Lỗi khi áp dụng hàng loạt');
    }
  };

  const handleNextCheck = () => {
    if (missingStaffCount > 0) {
      const confirmProceed = confirm(
        `Hiện còn ${missingStaffCount} gian hàng chưa phân công đủ Supervisor hoặc Approver. Bạn có muốn tiếp tục sang bước Xem lại & Kiểm tra điều kiện không?`
      );
      if (!confirmProceed) return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Overall KPI Bar */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                  Phân công nhân sự theo địa điểm
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Gán Giám sát viên (Supervisor) và Người duyệt (Approver) phụ trách từng gian hàng.
                </CardDescription>
              </div>
            </div>

            {/* Quick Action & Modal Trigger */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  setDefaultInviteRole(CampaignRole.SUPERVISOR);
                  setIsInviteModalOpen(true);
                }}
                className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs h-9 px-3.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Mời nhân sự mới
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Staffing KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 text-xs bg-white">
          <div className="p-3.5 flex flex-col justify-center">
            <span className="text-slate-400 font-medium text-[11px]">Tổng số gian hàng</span>
            <span className="text-base font-bold text-slate-900 mt-0.5">{totalBoothsCount} booth</span>
          </div>

          <div className="p-3.5 flex flex-col justify-center">
            <span className="text-slate-400 font-medium text-[11px]">Đã đủ nhân sự</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-bold text-emerald-600">{fullyStaffedCount}</span>
              <span className="text-slate-400">/{totalBoothsCount}</span>
              {fullyStaffedCount === totalBoothsCount && totalBoothsCount > 0 && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              )}
            </div>
          </div>

          <div className="p-3.5 flex flex-col justify-center">
            <span className="text-slate-400 font-medium text-[11px]">Chưa phân công</span>
            <span className={`text-base font-bold mt-0.5 ${missingStaffCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
              {missingStaffCount} booth
            </span>
          </div>

          <div className="p-3.5 flex flex-col justify-center">
            <span className="text-slate-400 font-medium text-[11px]">Nhân sự chờ xác nhận</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-base font-bold text-blue-600">{pendingStaffCount}</span>
              <span className="text-slate-400">lời mời (⏳)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Master–Detail Layout Container */}
      {locations.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border border-dashed border-slate-200">
          Chưa có địa điểm nào được tạo. Vui lòng quay lại Bước 2 để thêm địa điểm và gian hàng.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (MASTER - 4/12 columns): Danh sách Địa điểm */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Địa điểm ({locations.length})
              </span>
            </div>

            {/* Tìm kiếm địa điểm nhanh nếu > 3 địa điểm */}
            {locations.length > 3 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm địa điểm..."
                  value={searchLocationQuery}
                  onChange={(e) => setSearchLocationQuery(e.target.value)}
                  className="pl-8 h-8 text-xs border-slate-200 focus-visible:ring-blue-600"
                />
              </div>
            )}

            {/* List Location Cards */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredLocations.map((loc) => {
                const isSelected = loc.id === (activeLocation?.id || '');
                const booths = loc.booths || [];
                const locMissing = booths.filter(
                  (b) => !b.supervisorMemberId || !b.approverMemberId
                ).length;
                const locPending = booths.filter(
                  (b) => b.isSupervisorPending || b.isApproverPending
                ).length;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-start justify-between gap-2.5 cursor-pointer',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50/70 text-slate-700'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                        <MapPin
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            isSelected ? 'text-blue-600' : 'text-slate-400'
                          )}
                        />
                        <span className="truncate">{loc.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{loc.address}</p>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {booths.length} booth
                        </span>

                        {locMissing === 0 ? (
                          <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-0.5">
                            <Check className="h-2.5 w-2.5" /> Đủ
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold">
                            Thiếu {locMissing}
                          </span>
                        )}

                        {locPending > 0 && (
                          <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {locPending} chờ
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 mt-1 transition-transform',
                        isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* CỘT PHẢI (DETAIL - 8/12 columns): Chi tiết Booths & Gán hàng loạt */}
          <div className="lg:col-span-8 space-y-4">
            {activeLocation && (
              <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Header Địa điểm đang chọn */}
                <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {activeLocation.name}
                        </h3>
                        <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.2 text-[10px] font-bold">
                          {activeLocation.booths.length} gian hàng
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{activeLocation.address}</p>
                    </div>
                  </div>

                  {/* BATCH ASSIGN TOOLBAR (Gán hàng loạt cho toàn bộ booth tại đây) */}
                  <div className="mt-4 pt-3.5 border-t border-slate-200/80 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      <span>Gán nhanh cho TẤT CẢ {activeLocation.booths.length} gian hàng tại địa điểm này:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Chọn Supervisor hàng loạt */}
                      <div>
                        <select
                          value={batchSupervisorId}
                          onChange={(e) => setBatchSupervisorId(e.target.value)}
                          className="w-full h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">-- Chọn Supervisor hàng loạt --</option>
                          <optgroup label="🟢 Đã tham gia (Active)">
                            {supervisors
                              .filter((s) => !s.isPending)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.fullName} ({s.email})
                                </option>
                              ))}
                          </optgroup>
                          {supervisors.some((s) => s.isPending) && (
                            <optgroup label="🟡 Chờ xác nhận (Pending Invite)">
                              {supervisors
                                .filter((s) => s.isPending)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.email} (Chờ login)
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      {/* Chọn Approver hàng loạt */}
                      <div>
                        <select
                          value={batchApproverId}
                          onChange={(e) => setBatchApproverId(e.target.value)}
                          className="w-full h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="">-- Chọn Approver hàng loạt --</option>
                          <optgroup label="🟢 Đã tham gia (Active)">
                            {approvers
                              .filter((a) => !a.isPending)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.fullName} ({a.email})
                                </option>
                              ))}
                          </optgroup>
                          {approvers.some((a) => a.isPending) && (
                            <optgroup label="🟡 Chờ xác nhận (Pending Invite)">
                              {approvers
                                .filter((a) => a.isPending)
                                .map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.email} (Chờ login)
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="mt-2.5 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isBatchApplying || (!batchSupervisorId && !batchApproverId)}
                        onClick={handleApplyBatchLocation}
                        className="text-xs h-7 px-3 bg-slate-800 hover:bg-slate-900 text-white font-medium"
                      >
                        {isBatchApplying ? 'Đang áp dụng...' : 'Áp dụng cho tất cả booth'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Danh sách từng Booth tại Địa điểm */}
                <CardContent className="p-0">
                  {activeLocation.booths.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      Địa điểm này chưa có gian hàng nào.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {activeLocation.booths.map((b) => {
                        const hasSupervisor = Boolean(b.supervisorMemberId);
                        const hasApprover = Boolean(b.approverMemberId);
                        const isFullyStaffed = hasSupervisor && hasApprover;
                        const isPending = b.isSupervisorPending || b.isApproverPending;

                        return (
                          <div
                            key={b.id}
                            className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                          >
                            {/* Cột 1: Tên Booth */}
                            <div className="min-w-0 md:w-1/4">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <Store className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="truncate">{b.name}</span>
                              </div>
                              {b.code && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Mã: {b.code}
                                </span>
                              )}
                            </div>

                            {/* Cột 2: Supervisor Select */}
                            <div className="md:w-1/3">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Supervisor:
                              </label>
                              <select
                                value={b.supervisorMemberId || ''}
                                disabled={loadingBoothId === b.id}
                                onChange={(e) =>
                                  handleAssignBooth(
                                    b.id,
                                    e.target.value || null,
                                    b.approverMemberId || null
                                  )
                                }
                                className={cn(
                                  'w-full h-8 rounded-md px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors',
                                  !hasSupervisor
                                    ? 'border-amber-400 bg-amber-50/40 text-amber-900 font-medium'
                                    : b.isSupervisorPending
                                    ? 'border-blue-300 bg-blue-50/30 text-blue-900'
                                    : 'border-slate-200 bg-white text-slate-800'
                                )}
                              >
                                <option value="">-- Chưa gán Supervisor --</option>
                                <optgroup label="🟢 Đã tham gia (Active)">
                                  {supervisors
                                    .filter((s) => !s.isPending)
                                    .map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.fullName} ({s.email})
                                      </option>
                                    ))}
                                </optgroup>
                                {supervisors.some((s) => s.isPending) && (
                                  <optgroup label="🟡 Chờ xác nhận (Pending Invite)">
                                    {supervisors
                                      .filter((s) => s.isPending)
                                      .map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.email} (Chờ login)
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                                <option value="__INVITE_NEW__">➕ Mời nhân sự mới qua email...</option>
                              </select>
                            </div>

                            {/* Cột 3: Approver Select */}
                            <div className="md:w-1/3">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Approver:
                              </label>
                              <select
                                value={b.approverMemberId || ''}
                                disabled={loadingBoothId === b.id}
                                onChange={(e) =>
                                  handleAssignBooth(
                                    b.id,
                                    b.supervisorMemberId || null,
                                    e.target.value || null
                                  )
                                }
                                className={cn(
                                  'w-full h-8 rounded-md px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors',
                                  !hasApprover
                                    ? 'border-amber-400 bg-amber-50/40 text-amber-900 font-medium'
                                    : b.isApproverPending
                                    ? 'border-blue-300 bg-blue-50/30 text-blue-900'
                                    : 'border-slate-200 bg-white text-slate-800'
                                )}
                              >
                                <option value="">-- Chưa gán Approver --</option>
                                <optgroup label="🟢 Đã tham gia (Active)">
                                  {approvers
                                    .filter((a) => !a.isPending)
                                    .map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.fullName} ({a.email})
                                      </option>
                                    ))}
                                </optgroup>
                                {approvers.some((a) => a.isPending) && (
                                  <optgroup label="🟡 Chờ xác nhận (Pending Invite)">
                                    {approvers
                                      .filter((a) => a.isPending)
                                      .map((a) => (
                                        <option key={a.id} value={a.id}>
                                          {a.email} (Chờ login)
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                                <option value="__INVITE_NEW__">➕ Mời nhân sự mới qua email...</option>
                              </select>
                            </div>

                            {/* Cột 4: Trạng thái Booth */}
                            <div className="shrink-0 pt-2 md:pt-4">
                              {isFullyStaffed ? (
                                isPending ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                    <Clock className="h-3 w-3" />
                                    Chờ kích hoạt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Đủ nhân sự
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <AlertTriangle className="h-3 w-3" />
                                  Thiếu nhân sự
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Pro-tip */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
        <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-800">Mẹo vận hành:</strong> Bạn có thể phân công cả nhân sự chưa kích hoạt tài khoản Google (Pending Invite). Nhân sự sẽ nhận email mời và tự động kích hoạt quyền ngay khi đăng nhập.
        </p>
      </div>

      {/* Quick Invite Modal */}
      <QuickInviteModal
        campaignId={campaign.id}
        isOpen={isInviteModalOpen}
        defaultRole={defaultInviteRole}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          router.refresh();
          if (onAutoSaveNotify) onAutoSaveNotify();
        }}
      />

      {/* Footer Navigation */}
      <WizardFooter currentStep={4} onBack={onBack} onNext={handleNextCheck} />
    </div>
  );
}
