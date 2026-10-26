'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Campaign,
  Location,
  CampaignMember,
  CampaignInvite,
  CampaignMemberHistory,
} from '@/domain/entities';
import { CampaignRole, CampaignStatus, CampaignMemberStatus } from '@/domain/enums';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Building2,
  Users,
  CheckCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserPlus,
  Copy,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { CampaignHierarchyView } from '../campaign-hierarchy-view';
import { QuickInviteModal } from '../wizard/quick-invite-modal';
import {
  updateCampaignMemberAction,
  resendCampaignInviteEmailAction,
} from '../../actions/member-actions';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { getRoleLabel, getMemberStatusLabel } from '@/lib/i18n/enum-presenters';

interface CampaignWorkspaceProps {
  campaign: Campaign;
  locations: Location[];
  members: CampaignMember[];
  invites: CampaignInvite[];
  history: CampaignMemberHistory[];
  stats: {
    totalBooths: number;
    submittedCount: number;
    approvedCount: number;
    pendingReviewsCount: number;
    missingStaffCount: number;
  };
  isManager: boolean;
}

type WorkspaceTab = 'OVERVIEW' | 'LOCATIONS' | 'TEAM' | 'APPROVALS';

export function CampaignWorkspace({
  campaign,
  locations,
  members,
  invites,
  history,
  stats,
  isManager,
}: CampaignWorkspaceProps) {
  const router = useRouter();
  const tCamp = useTranslations('campaigns');
  const tRoles = useTranslations('roles');
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('OVERVIEW');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isDraft = campaign.status === CampaignStatus.DRAFT;

  // Tính toán phần trăm hoàn thành nghiệm thu
  const completionPercent =
    stats.totalBooths > 0
      ? Math.round((stats.approvedCount / stats.totalBooths) * 100)
      : 0;

  const showNotice = (type: 'success' | 'error', text: string) => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCopyInviteLink = (invite: CampaignInvite) => {
    const link = `${window.location.origin}/auth/invite?email=${encodeURIComponent(
      invite.email
    )}&campaignId=${campaign.id}&role=${invite.role}&type=campaign`;
    navigator.clipboard.writeText(link);
    setCopiedLink(invite.id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleResendInvite = async (inviteId: string) => {
    setResendingInviteId(inviteId);
    const res = await resendCampaignInviteEmailAction(campaign.id, inviteId);
    setResendingInviteId(null);

    if (res.success) {
      showNotice('success', tCamp('workspace.toastResendSuccess'));
      router.refresh();
    } else {
      showNotice('error', res.error || tCamp('workspace.toastResendError'));
    }
  };

  const handleUpdateMemberAccess = async (
    memberId: string,
    role: CampaignRole,
    revoke: boolean
  ) => {
    setUpdatingMemberId(memberId);
    const res = await updateCampaignMemberAction(campaign.id, memberId, role, revoke);
    setUpdatingMemberId(null);

    if (res.success) {
      router.refresh();
    } else {
      showNotice('error', res.error || tCamp('workspace.toastUpdateError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div
          className={cn(
            'fixed top-5 right-5 z-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-white',
            actionNotice.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          )}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* 1. DRAFT WARNING BANNER */}
      {isDraft && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3 text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm leading-tight text-amber-950">
                {tCamp('workspace.draftBannerTitle')}
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {tCamp('workspace.draftBannerDesc')}
              </p>
            </div>
          </div>

          <Link href={`/campaigns/${campaign.id}/wizard?step=${campaign.wizardStep || 1}`}>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs shrink-0 self-end sm:self-auto cursor-pointer"
            >
              <span>{tCamp('workspace.btnContinueWizard')}</span>
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Workspace Tab Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-xl shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW')}
          className={cn(
            'flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>{tCamp('tabs.overview')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LOCATIONS')}
          className={cn(
            'flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'LOCATIONS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          )}
        >
          <Building2 className="h-4 w-4" />
          <span>
            {tCamp('tabs.locations')} ({locations.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TEAM')}
          className={cn(
            'flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'TEAM'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          )}
        >
          <Users className="h-4 w-4" />
          <span>
            {tCamp('tabs.team')} ({members.length + invites.length})
          </span>
          {invites.length > 0 && (
            <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 font-bold">
              {invites.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('APPROVALS')}
          className={cn(
            'flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'APPROVALS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          )}
        >
          <CheckCheck className="h-4 w-4" />
          <span>{tCamp('tabs.approvals')}</span>
          {stats.pendingReviewsCount > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 font-bold animate-pulse">
              {stats.pendingReviewsCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB 1: TỔNG QUAN (OVERVIEW) */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 bg-white shadow-2xs">
              <span className="text-xs font-medium text-slate-400">{tCamp('workspace.kpiBooths')}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{stats.totalBooths}</span>
                <span className="text-xs text-slate-500">
                  {tCamp('workspace.kpiBoothsSub', { count: locations.length })}
                </span>
              </div>
            </Card>

            <Card className="p-4 border-slate-200 bg-white shadow-2xs">
              <span className="text-xs font-medium text-slate-400">{tCamp('workspace.kpiSubmitted')}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-blue-600">{stats.submittedCount}</span>
                <span className="text-xs text-slate-500">{tCamp('workspace.kpiSubmittedUnit')}</span>
              </div>
            </Card>

            <Card className="p-4 border-slate-200 bg-white shadow-2xs">
              <span className="text-xs font-medium text-slate-400">{tCamp('workspace.kpiPendingReviews')}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-2xl font-bold ${
                    stats.pendingReviewsCount > 0 ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  {stats.pendingReviewsCount}
                </span>
                <span className="text-xs text-slate-500">{tCamp('workspace.kpiPendingReviewsUnit')}</span>
              </div>
            </Card>

            <Card className="p-4 border-slate-200 bg-white shadow-2xs">
              <span className="text-xs font-medium text-slate-400">{tCamp('workspace.completionRate')}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600">{completionPercent}%</span>
                <span className="text-xs text-slate-500">
                  ({tCamp('workspace.approvedCount', { count: stats.approvedCount })})
                </span>
              </div>
            </Card>
          </div>

          {/* ACTION REQUIRED WIDGET */}
          <Card className="border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  {tCamp('workspace.urgentAttention')}
                </CardTitle>
              </div>
              <span className="text-[11px] text-slate-400">{tCamp('workspace.realtimeUpdate')}</span>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {stats.pendingReviewsCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      {tCamp('workspace.pendingReviewsPrompt', { count: stats.pendingReviewsCount })}
                    </span>
                  </div>
                  <Link href="/campaigns/approvals">
                    <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">
                      {tCamp('workspace.openApprovalQueue')}
                    </Button>
                  </Link>
                </div>
              )}

              {invites.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Users className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      {tCamp('workspace.pendingInvitesPrompt', { count: invites.length })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('TEAM')}
                    className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    {tCamp('workspace.viewAndResend')}
                  </Button>
                </div>
              )}

              {stats.missingStaffCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-200 text-xs">
                  <div className="flex items-center gap-2 text-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>
                      {tCamp('workspace.missingStaffPrompt', { count: stats.missingStaffCount })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('LOCATIONS')}
                    className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    {tCamp('workspace.assignNow')}
                  </Button>
                </div>
              )}

              {stats.pendingReviewsCount === 0 && invites.length === 0 && stats.missingStaffCount === 0 && (
                <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{tCamp('workspace.allOnTrack')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('LOCATIONS')}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20 text-left transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>{tCamp('workspace.quickHierarchy')}</span>
              </div>
              <p className="text-[11px] text-slate-500">{tCamp('workspace.quickHierarchyDesc')}</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TEAM')}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20 text-left transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{tCamp('workspace.quickTeam')}</span>
              </div>
              <p className="text-[11px] text-slate-500">{tCamp('workspace.quickTeamDesc')}</p>
            </button>

            <Link
              href="/campaigns/approvals"
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20 text-left transition-all shadow-2xs cursor-pointer block"
            >
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1">
                <CheckCheck className="h-4 w-4 text-emerald-600" />
                <span>{tCamp('workspace.quickApprovals')}</span>
              </div>
              <p className="text-[11px] text-slate-500">{tCamp('workspace.quickApprovalsDesc')}</p>
            </Link>
          </div>
        </div>
      )}

      {/* 4. TAB 2: ĐỊA ĐIỂM & GIAN HÀNG */}
      {activeTab === 'LOCATIONS' && (
        <CampaignHierarchyView
          campaignId={campaign.id}
          locations={locations}
          members={members}
          isManager={isManager}
        />
      )}

      {/* 5. TAB 3: ĐỘI NGŨ NHÂN SỰ & QUẢN LÝ THÀNH VIÊN */}
      {activeTab === 'TEAM' && (
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                  {tCamp('team.title')}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {tCamp('team.description')}
                </CardDescription>
              </div>

              {isManager && (
                <Button
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {tCamp('team.inviteButton')}
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {/* Bảng nhân sự chính thức */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">{tCamp('team.tableMember')}</th>
                      <th className="py-3 px-4">{tCamp('team.tableRole')}</th>
                      <th className="py-3 px-4">{tCamp('team.tableStatus')}</th>
                      <th className="py-3 px-4 text-right">{tCamp('team.tableActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{member.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{member.email}</div>
                        </td>

                        <td className="py-3 px-4">
                          {isManager ? (
                            <select
                              value={member.role}
                              disabled={updatingMemberId === member.id || member.status === CampaignMemberStatus.REVOKED}
                              onChange={(e) =>
                                handleUpdateMemberAccess(
                                  member.id,
                                  e.target.value as CampaignRole,
                                  false
                                )
                              }
                              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs focus:ring-2 focus:ring-blue-600"
                            >
                              <option value={CampaignRole.SUPERVISOR}>
                                {getRoleLabel(CampaignRole.SUPERVISOR, (k) => tRoles(k.replace('roles.', '') as any))}
                              </option>
                              <option value={CampaignRole.APPROVER}>
                                {getRoleLabel(CampaignRole.APPROVER, (k) => tRoles(k.replace('roles.', '') as any))}
                              </option>
                              <option value={CampaignRole.MANAGER}>
                                {getRoleLabel(CampaignRole.MANAGER, (k) => tRoles(k.replace('roles.', '') as any))}
                              </option>
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {getRoleLabel(member.role, (k) => tRoles(k.replace('roles.', '') as any))}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {member.status === CampaignMemberStatus.ACTIVE ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              {getMemberStatusLabel(member.status, (k) => tRoles(k.replace('memberStatus.', '') as any))}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {getMemberStatusLabel(member.status, (k) => tRoles(k.replace('memberStatus.', '') as any))}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isManager && member.role !== CampaignRole.MANAGER && (
                            <Button
                              size="sm"
                              variant={member.status === CampaignMemberStatus.ACTIVE ? 'destructive' : 'outline'}
                              disabled={updatingMemberId === member.id}
                              onClick={() =>
                                handleUpdateMemberAccess(
                                  member.id,
                                  member.role,
                                  member.status === CampaignMemberStatus.ACTIVE
                                )
                              }
                              className="h-7 text-xs px-2.5 cursor-pointer"
                            >
                              {member.status === CampaignMemberStatus.ACTIVE
                                ? tCamp('team.revokeAccess')
                                : tCamp('team.restoreAccess')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Danh sách lời mời đang chờ xác nhận (Pending Invites) */}
              {invites.length > 0 && (
                <div className="border-t border-slate-200 bg-blue-50/20 p-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>{tCamp('team.pendingInvitesTitle', { count: invites.length })}</span>
                  </h4>

                  <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {invites.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{inv.email}</span>
                          <span className="ml-2 text-slate-500 font-medium">
                            ({getRoleLabel(inv.role, (k) => tRoles(k.replace('roles.', '') as any))})
                          </span>
                          <span className="ml-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.2 text-[10px] font-medium">
                            {tRoles('inviteStatus.PENDING')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyInviteLink(inv)}
                            className="h-7 text-xs gap-1 border-slate-200 cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedLink === inv.id ? tCamp('team.copied') : tCamp('team.copyLink')}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resendingInviteId === inv.id}
                            onClick={() => handleResendInvite(inv.id)}
                            className="h-7 text-xs gap-1 border-slate-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <RefreshCw className={cn('h-3 w-3', resendingInviteId === inv.id && 'animate-spin')} />
                            {resendingInviteId === inv.id ? tCamp('team.resending') : tCamp('team.resendEmail')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Trail: Lịch sử phân quyền */}
          <Card className="border border-slate-200 bg-white shadow-2xs">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {tCamp('team.auditTrailTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">{tCamp('team.auditEmpty')}</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-slate-600 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(h.createdAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                      </span>
                      <span>•</span>
                      <span>
                        {tCamp('team.auditEntry', {
                          oldRole: h.previousRole
                            ? getRoleLabel(h.previousRole as CampaignRole, (k) => tRoles(k.replace('roles.', '') as any))
                            : '—',
                          oldStatus: h.previousStatus || '—',
                          newRole: getRoleLabel(h.newRole as CampaignRole, (k) => tRoles(k.replace('roles.', '') as any)),
                          newStatus: h.newStatus,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. TAB 4: TIẾN ĐỘ & NGHIỆM THU */}
      {activeTab === 'APPROVALS' && (
        <Card className="border border-slate-200 bg-white p-6 text-center space-y-4">
          <CheckCheck className="h-10 w-10 text-blue-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">{tCamp('workspace.approvalsTabTitle')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {tCamp('workspace.approvalsTabDesc')}
          </p>
          <div className="pt-2">
            <Link href="/campaigns/approvals">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer">
                <span>{tCamp('workspace.btnOpenApprovalsHub')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Invite Modal */}
      <QuickInviteModal
        campaignId={campaign.id}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
