'use client';

import React, { useState, useMemo } from 'react';
import { CampaignPersonnelItem } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  RotateCw,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Store,
  Sparkles,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resendCampaignInviteEmailAction } from '@/features/campaigns/actions/member-actions';
import { PersonnelConfirmRevokeModal } from './personnel-confirm-revoke-modal';

export interface CampaignPersonnelSectionProps {
  campaignId: string;
  personnelList: CampaignPersonnelItem[];
  onInviteNew: () => void;
  onRefresh: () => void;
  className?: string;
}

export function CampaignPersonnelSection({
  campaignId,
  personnelList,
  onInviteNew,
  onRefresh,
  className,
}: CampaignPersonnelSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [revokingPersonnel, setRevokingPersonnel] = useState<CampaignPersonnelItem | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Counters
  const activeCount = useMemo(
    () => personnelList.filter((p) => !p.isPending).length,
    [personnelList]
  );
  const pendingCount = useMemo(
    () => personnelList.filter((p) => p.isPending).length,
    [personnelList]
  );

  // Filtered List
  const filteredList = useMemo(() => {
    return personnelList.filter((p) => {
      // Filter status
      if (statusFilter === 'ACTIVE' && p.isPending) return false;
      if (statusFilter === 'PENDING' && !p.isPending) return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.fullName && p.fullName.toLowerCase().includes(q);
        const matchEmail = p.email && p.email.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }

      return true;
    });
  }, [personnelList, statusFilter, searchQuery]);

  // Handle Resend Invite
  const handleResend = async (p: CampaignPersonnelItem) => {
    setResendingInviteId(p.rawId);
    setStatusNotification(null);
    try {
      const res = await resendCampaignInviteEmailAction(campaignId, p.rawId);
      if (res.success) {
        setStatusNotification(`Đã gửi lại email mời tới ${p.email}.`);
      } else {
        alert(res.error || 'Lỗi gửi lại email mời.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi lại email mời.');
    } finally {
      setResendingInviteId(null);
      setTimeout(() => setStatusNotification(null), 4000);
    }
  };

  // Handle Copy Invite Link
  const handleCopyLink = async (p: CampaignPersonnelItem) => {
    try {
      const res = await resendCampaignInviteEmailAction(campaignId, p.rawId);
      if (res.inviteLink) {
        navigator.clipboard.writeText(res.inviteLink);
        setCopiedInviteId(p.rawId);
        setTimeout(() => setCopiedInviteId(null), 2500);
      }
    } catch {
      alert('Không thể sao chép liên kết mời.');
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== email) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Card className={cn('border border-slate-200 bg-white shadow-xs overflow-hidden', className)}>
      {/* 1. Header Toolbar */}
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                  Nhân sự chiến dịch
                </CardTitle>
                <span className="rounded-full bg-slate-100 text-slate-600 font-bold px-2 py-0.5 text-[11px]">
                  {personnelList.length} nhân sự
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Quản lý thành viên và lời mời tham gia chiến dịch
              </CardDescription>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onInviteNew}
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs h-8 px-3"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Mời nhân sự
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2.5 text-xs text-slate-600 border-slate-200"
              title={isExpanded ? 'Thu gọn danh sách' : 'Mở rộng danh sách'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusNotification && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{statusNotification}</span>
          </div>
        )}
      </CardHeader>

      {/* 2. Collapsible Content */}
      {isExpanded && (
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Stats Bar & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={cn(
                  'px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer',
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Tất cả ({personnelList.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={cn(
                  'px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Đã kích hoạt ({activeCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={cn(
                  'px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                  statusFilter === 'PENDING'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                Chờ xác nhận ({pendingCount})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Tìm nhân sự theo tên/email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
              />
            </div>
          </div>

          {/* Cards Grid */}
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              {searchQuery
                ? `Không tìm thấy nhân sự nào khớp với "${searchQuery}".`
                : 'Chưa có nhân sự nào trong danh sách này. Hãy bấm "Mời nhân sự" để thêm mới.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredList.map((p) => {
                const isPending = p.isPending;
                const initials = getInitials(p.fullName, p.email);
                const assignedCount = p.assignedBooths.length;

                return (
                  <div
                    key={p.id}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-3 bg-white hover:shadow-xs',
                      isPending ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'
                    )}
                  >
                    {/* Top: Avatar + Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs',
                          isPending
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 truncate">
                            {isPending ? p.email : p.fullName}
                          </span>
                          {/* Status Badge */}
                          {isPending ? (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 px-1.5 py-0.5 text-[10px] font-medium">
                              <Clock className="h-2.5 w-2.5" />
                              Chờ xác nhận
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-semibold">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Đã kích hoạt
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.email}</p>

                        {/* Role & Assigned Booths */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {p.role}
                          </span>

                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1',
                              assignedCount > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold'
                                : 'bg-slate-50 text-slate-400'
                            )}
                          >
                            <Store className="h-2.5 w-2.5" />
                            {assignedCount > 0
                              ? `${assignedCount} booth phụ trách`
                              : 'Chưa gán booth'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
                      {isPending ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={resendingInviteId === p.rawId}
                            onClick={() => handleResend(p)}
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-blue-600 gap-1"
                            title="Gửi lại email mời"
                          >
                            <RotateCw
                              className={cn(
                                'h-3 w-3',
                                resendingInviteId === p.rawId && 'animate-spin text-blue-600'
                              )}
                            />
                            Gửi lại
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(p)}
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 gap-1"
                            title="Sao chép link mời trực tiếp"
                          >
                            {copiedInviteId === p.rawId ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Link mời
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokingPersonnel(p)}
                            className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                            title="Thu hồi lời mời"
                          >
                            <Trash2 className="h-3 w-3" />
                            Thu hồi
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokingPersonnel(p)}
                          className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                          title="Xóa thành viên khỏi chiến dịch"
                        >
                          <Trash2 className="h-3 w-3" />
                          Xóa khỏi chiến dịch
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}

      {/* Confirmation Modal */}
      <PersonnelConfirmRevokeModal
        isOpen={Boolean(revokingPersonnel)}
        onClose={() => setRevokingPersonnel(null)}
        personnel={revokingPersonnel}
        campaignId={campaignId}
        onSuccess={(msg) => {
          setStatusNotification(msg);
          onRefresh();
          setTimeout(() => setStatusNotification(null), 4000);
        }}
      />
    </Card>
  );
}
