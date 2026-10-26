'use client';

import { useActionState, useState, useTransition } from 'react';
import { CampaignInvite, CampaignMember } from '@/domain/entities';
import { CampaignMemberStatus, CampaignRole } from '@/domain/enums';
import {
  inviteCampaignMemberAction,
  updateCampaignMemberRoleAction,
  restoreCampaignMemberAction,
  resendCampaignInviteEmailAction,
} from '../actions/member-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, RotateCw, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersonnelConfirmRevokeModal } from './wizard/personnel-confirm-revoke-modal';
import { CampaignPersonnelItem } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { useRouter } from 'next/navigation';

export interface MemberWithAssignments extends CampaignMember {
  assignedBooths?: {
    boothId: string;
    boothName: string;
    boothCode?: string | null;
    locationId: string;
    locationName: string;
    role: 'SUPERVISOR' | 'APPROVER';
  }[];
}

export interface InviteWithAssignments extends CampaignInvite {
  assignedBooths?: {
    boothId: string;
    boothName: string;
    boothCode?: string | null;
    locationId: string;
    locationName: string;
    role: 'SUPERVISOR' | 'APPROVER';
  }[];
}

interface MemberManagerProps {
  campaignId: string;
  members: MemberWithAssignments[];
  invites: InviteWithAssignments[];
}

export function MemberManager({ campaignId, members, invites }: MemberManagerProps) {
  const router = useRouter();
  const [state, action, pendingInvite] = useActionState(inviteCampaignMemberAction, null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [revokingTarget, setRevokingTarget] = useState<CampaignPersonnelItem | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Handle role change directly
  const handleRoleChange = (memberId: string, role: CampaignRole) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCampaignMemberRoleAction(campaignId, memberId, role);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  // Handle restore revoked member
  const handleRestore = (memberId: string, role: CampaignRole) => {
    setError(null);
    startTransition(async () => {
      const result = await restoreCampaignMemberAction(campaignId, memberId, role);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessNotice('Đã khôi phục thành viên thành công.');
        router.refresh();
        setTimeout(() => setSuccessNotice(null), 3000);
      }
    });
  };

  // Handle resend invite email
  const handleResend = async (invite: InviteWithAssignments) => {
    setResendingId(invite.id);
    try {
      const res = await resendCampaignInviteEmailAction(campaignId, invite.id);
      if (res.success) {
        setSuccessNotice(`Đã gửi lại email mời tới ${invite.email}.`);
      } else {
        setError(res.error || 'Lỗi gửi lại email mời.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi lại email mời.');
    } finally {
      setResendingId(null);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  // Open safe revoke modal for active member
  const openRevokeMemberModal = (member: MemberWithAssignments) => {
    setRevokingTarget({
      id: member.id,
      rawId: member.id,
      isPending: false,
      role: member.role,
      status: member.status === CampaignMemberStatus.ACTIVE ? 'ACTIVE' : 'REVOKED',
      email: member.email,
      fullName: member.fullName,
      avatarUrl: member.avatarUrl || null,
      createdAt: member.createdAt,
      assignedBooths: member.assignedBooths || [],
    });
  };

  // Open safe cancel modal for pending invite
  const openCancelInviteModal = (invite: InviteWithAssignments) => {
    setRevokingTarget({
      id: `invite_${invite.id}`,
      rawId: invite.id,
      isPending: true,
      role: invite.role,
      status: 'PENDING',
      email: invite.email,
      fullName: invite.email,
      avatarUrl: null,
      createdAt: invite.createdAt,
      assignedBooths: invite.assignedBooths || [],
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Add / Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thêm hoặc mời thành viên mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input type="hidden" name="campaignId" value={campaignId} />
            <Input name="email" type="email" required placeholder="account@gmail.com" />
            <select
              name="role"
              defaultValue={CampaignRole.SUPERVISOR}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {Object.values(CampaignRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Button type="submit" isLoading={pendingInvite}>
              Thêm thành viên
            </Button>
          </form>

          {(state?.error || error) && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{state?.error || error}</span>
            </div>
          )}

          {(state?.success || successNotice) && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{state?.success || successNotice}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Active Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Thành viên chiến dịch ({members.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {members.map((member) => {
            const assignedCount = member.assignedBooths?.length || 0;
            const isRevoked = member.status === CampaignMemberStatus.REVOKED;

            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{member.fullName}</p>
                    {isRevoked ? (
                      <span className="rounded-md bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold">
                        Đã thu hồi
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Hoạt động
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1',
                        assignedCount > 0
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      <Store className="h-2.5 w-2.5" />
                      {assignedCount > 0 ? `${assignedCount} booth phụ trách` : 'Chưa phân công booth'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    disabled={isPending || isRevoked}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as CampaignRole)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {Object.values(CampaignRole).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>

                  {!isRevoked ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => openRevokeMemberModal(member)}
                      className="text-xs h-9"
                    >
                      Thu hồi
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleRestore(member.id, member.role)}
                      className="text-xs h-9"
                    >
                      Khôi phục
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 3. Pending Invites List */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Lời mời chưa đăng nhập ({invites.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 text-xs">
            {invites.map((invite) => {
              const assignedCount = invite.assignedBooths?.length || 0;

              return (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{invite.email}</span>
                      <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Chờ xác nhận
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-[11px]">
                      <span>Vai trò: <strong className="text-slate-700">{invite.role}</strong></span>
                      <span>·</span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1',
                          assignedCount > 0 ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-400'
                        )}
                      >
                        <Store className="h-2.5 w-2.5" />
                        {assignedCount > 0 ? `${assignedCount} booth phụ trách` : 'Chưa phân công'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={resendingId === invite.id}
                      onClick={() => handleResend(invite)}
                      className="h-8 text-xs gap-1 text-slate-700"
                    >
                      <RotateCw className={cn('h-3 w-3', resendingId === invite.id && 'animate-spin text-blue-600')} />
                      Gửi lại email
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openCancelInviteModal(invite)}
                      className="h-8 text-xs gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Hủy lời mời
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <PersonnelConfirmRevokeModal
        isOpen={Boolean(revokingTarget)}
        onClose={() => setRevokingTarget(null)}
        personnel={revokingTarget}
        campaignId={campaignId}
        onSuccess={(msg) => {
          setSuccessNotice(msg);
          router.refresh();
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />
    </div>
  );
}
