'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resendCampaignInviteEmailAction } from '@/features/campaigns/actions/member-actions';
import { PersonnelConfirmRevokeModal } from './personnel-confirm-revoke-modal';
import { CampaignRole } from '@/domain/enums';
import { useTranslations } from 'next-intl';
import { getRoleLabel } from '@/lib/i18n/enum-presenters';

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

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
  const tRoles = useTranslations('roles');
  const tCamp = useTranslations('campaigns');
  const tPersonnel = useTranslations('campaigns.personnelSection');

  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | CampaignRole>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const [revokingPersonnel, setRevokingPersonnel] = useState<CampaignPersonnelItem | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Status Counters
  const activeCount = useMemo(
    () => personnelList.filter((p) => !p.isPending).length,
    [personnelList]
  );
  const pendingCount = useMemo(
    () => personnelList.filter((p) => p.isPending).length,
    [personnelList]
  );

  // Role Counters
  const supervisorCount = useMemo(
    () => personnelList.filter((p) => p.role === CampaignRole.SUPERVISOR).length,
    [personnelList]
  );
  const approverCount = useMemo(
    () => personnelList.filter((p) => p.role === CampaignRole.APPROVER).length,
    [personnelList]
  );
  const managerCount = useMemo(
    () => personnelList.filter((p) => p.role === CampaignRole.MANAGER).length,
    [personnelList]
  );

  // Filtered List
  const filteredList = useMemo(() => {
    return personnelList.filter((p) => {
      // Filter status
      if (statusFilter === 'ACTIVE' && p.isPending) return false;
      if (statusFilter === 'PENDING' && !p.isPending) return false;

      // Filter role
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;

      // Filter search (accent-insensitive)
      if (searchQuery.trim()) {
        const q = normalizeVietnamese(searchQuery);
        const matchName = p.fullName && normalizeVietnamese(p.fullName).includes(q);
        const matchEmail = p.email && normalizeVietnamese(p.email).includes(q);
        if (!matchName && !matchEmail) return false;
      }

      return true;
    });
  }, [personnelList, statusFilter, roleFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, roleFilter, searchQuery, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

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

  const getRoleBadge = (role: CampaignRole) => {
    switch (role) {
      case CampaignRole.MANAGER:
        return (
          <span className="inline-flex items-center rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 text-[10px] font-bold">
            {getRoleLabel(role, tRoles)}
          </span>
        );
      case CampaignRole.SUPERVISOR:
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold">
            {getRoleLabel(role, tRoles)}
          </span>
        );
      case CampaignRole.APPROVER:
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold">
            {getRoleLabel(role, tRoles)}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold">
            {role}
          </span>
        );
    }
  };

  return (
    <Card className={cn('border border-slate-200 bg-white shadow-xs', className)}>
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
                  {tPersonnel('title')}
                </CardTitle>
                <span className="rounded-full bg-slate-100 text-slate-600 font-bold px-2 py-0.5 text-[11px]">
                  {tPersonnel('staffCount', { count: personnelList.length })}
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {tPersonnel('subtitle')}
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
              {tPersonnel('inviteButton')}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2.5 text-xs text-slate-600 border-slate-200"
              title={isExpanded ? 'Collapse' : 'Expand'}
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
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {/* Controls Bar 1: Status & Role Filters, View Switcher, Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Combined Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer',
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tPersonnel('tabAll', { count: personnelList.length })}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                    statusFilter === 'ACTIVE'
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {tPersonnel('tabActive', { count: activeCount })}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                    statusFilter === 'PENDING'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {tPersonnel('tabPending', { count: pendingCount })}
                </button>
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className={cn(
                    'px-2 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px]',
                    roleFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tCamp('wizard.allRoles')}
                </button>

                <button
                  type="button"
                  onClick={() => setRoleFilter(CampaignRole.SUPERVISOR)}
                  className={cn(
                    'px-2 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px]',
                    roleFilter === CampaignRole.SUPERVISOR
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tRoles('roleShort.SUPERVISOR')} ({supervisorCount})
                </button>

                <button
                  type="button"
                  onClick={() => setRoleFilter(CampaignRole.APPROVER)}
                  className={cn(
                    'px-2 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px]',
                    roleFilter === CampaignRole.APPROVER
                      ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tRoles('roleShort.APPROVER')} ({approverCount})
                </button>

                <button
                  type="button"
                  onClick={() => setRoleFilter(CampaignRole.MANAGER)}
                  className={cn(
                    'px-2 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px]',
                    roleFilter === CampaignRole.MANAGER
                      ? 'bg-white text-purple-700 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tRoles('roleShort.MANAGER')} ({managerCount})
                </button>
              </div>
            </div>

            {/* Right: Search & View Toggle */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder={tPersonnel('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors cursor-pointer',
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'hover:text-slate-900'
                  )}
                  title="Table view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'hover:text-slate-900'
                  )}
                  title="Card view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content: Empty State / Table View / Card View */}
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? tPersonnel('emptyFiltered')
                : tPersonnel('emptyPersonnel')}
            </div>
          ) : viewMode === 'table' ? (
            /* COMPACT TABLE VIEW */
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">{tPersonnel('thMember')}</th>
                    <th className="px-3 py-2.5">{tPersonnel('thRole')}</th>
                    <th className="px-3 py-2.5">{tPersonnel('thStatus')}</th>
                    <th className="px-3 py-2.5">{tPersonnel('thBooths')}</th>
                    <th className="px-4 py-2.5 text-right">{tPersonnel('thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedList.map((p) => {
                    const isPending = p.isPending;
                    const initials = getInitials(p.fullName, p.email);
                    const assignedCount = p.assignedBooths.length;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Member info */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-[11px] shadow-2xs',
                                isPending
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                                {isPending ? p.email : p.fullName}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {getRoleBadge(p.role)}
                        </td>

                        {/* 3. Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
                              <Clock className="h-2.5 w-2.5" />
                              {tPersonnel('statusPendingGoogle')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {tPersonnel('statusActive')}
                            </span>
                          )}
                        </td>

                        {/* 4. Booth assignment */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {assignedCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              <Store className="h-3 w-3" />
                              {tPersonnel('assignedBoothCount', { count: assignedCount })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">{tPersonnel('unassignedBooths')}</span>
                          )}
                        </td>

                        {/* 5. Actions */}
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {isPending ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={resendingInviteId === p.rawId}
                                  onClick={() => handleResend(p)}
                                  className="h-7 px-2 text-[11px] text-slate-600 hover:text-blue-600 gap-1"
                                  title="Resend invite"
                                >
                                  <RotateCw
                                    className={cn(
                                      'h-3 w-3',
                                      resendingInviteId === p.rawId && 'animate-spin text-blue-600'
                                    )}
                                  />
                                  {tPersonnel('btnResend')}
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyLink(p)}
                                  className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 gap-1"
                                  title="Copy invite link"
                                >
                                  {copiedInviteId === p.rawId ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600" />
                                      <span className="text-emerald-600">{tCamp('team.copied')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      {tPersonnel('btnInviteLink')}
                                    </>
                                  )}
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRevokingPersonnel(p)}
                                  className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                                  title="Revoke invite"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {tPersonnel('btnRevoke')}
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setRevokingPersonnel(p)}
                                className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                                title="Remove member"
                              >
                                <Trash2 className="h-3 w-3" />
                                {tPersonnel('btnRemove')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedList.map((p) => {
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
                              {tPersonnel('statusPendingGoogle')}
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-semibold">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {tPersonnel('statusActive')}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.email}</p>

                        {/* Role & Assigned Booths */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {getRoleBadge(p.role)}

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
                              ? tPersonnel('assignedBoothCount', { count: assignedCount })
                              : tPersonnel('unassignedBooths')}
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
                            title="Resend invite"
                          >
                            <RotateCw
                              className={cn(
                                'h-3 w-3',
                                resendingInviteId === p.rawId && 'animate-spin text-blue-600'
                              )}
                            />
                            {tPersonnel('btnResend')}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(p)}
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 gap-1"
                            title="Copy invite link"
                          >
                            {copiedInviteId === p.rawId ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600">{tCamp('team.copied')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                {tPersonnel('btnInviteLink')}
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokingPersonnel(p)}
                            className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                            title="Revoke invite"
                          >
                            <Trash2 className="h-3 w-3" />
                            {tPersonnel('btnRevoke')}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokingPersonnel(p)}
                          className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                          title="Remove member"
                        >
                          <Trash2 className="h-3 w-3" />
                          {tPersonnel('btnRemove')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredList.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  {tPersonnel('showingRange', {
                    from: (currentPage - 1) * pageSize + 1,
                    to: Math.min(currentPage * pageSize, filteredList.length),
                    total: filteredList.length,
                  })}
                </span>
                {/* Page Size Selector */}
                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                  <span className="text-[11px] text-slate-400">View:</span>
                  {[5, 10, 20].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer',
                        pageSize === size
                          ? 'bg-blue-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs gap-1 text-slate-600 border-slate-200 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {tPersonnel('pagePrevious')}
                </Button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'min-w-[26px] h-7 px-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs gap-1 text-slate-600 border-slate-200 cursor-pointer"
                >
                  {tPersonnel('pageNext')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
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
