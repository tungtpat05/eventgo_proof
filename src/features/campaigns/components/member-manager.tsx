'use client';

import { useActionState, useState, useTransition } from 'react';
import { CampaignInvite, CampaignMember } from '@/domain/entities';
import { CampaignMemberStatus, CampaignRole } from '@/domain/enums';
import { inviteCampaignMemberAction, updateCampaignMemberAction } from '../actions/member-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MemberManagerProps {
  campaignId: string;
  members: CampaignMember[];
  invites: CampaignInvite[];
}

export function MemberManager({ campaignId, members, invites }: MemberManagerProps) {
  const [state, action, pendingInvite] = useActionState(inviteCampaignMemberAction, null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const updateMember = (memberId: string, role: CampaignRole, revoke: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCampaignMemberAction(campaignId, memberId, role, revoke);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Thêm hoặc mời thành viên</CardTitle></CardHeader>
        <CardContent>
          <form action={action} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input type="hidden" name="campaignId" value={campaignId} />
            <Input name="email" type="email" required placeholder="account@gmail.com" />
            <select name="role" defaultValue={CampaignRole.SUPERVISOR} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
              {Object.values(CampaignRole).map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <Button type="submit" isLoading={pendingInvite}>Thêm thành viên</Button>
          </form>
          {(state?.error || error) && <p className="mt-3 text-sm text-red-600">{state?.error || error}</p>}
          {state?.success && <p className="mt-3 text-sm text-emerald-700">{state.success}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Thành viên chiến dịch</CardTitle></CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{member.fullName}</p>
                <p className="text-xs text-slate-500">{member.email} · {member.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  disabled={isPending || member.status === CampaignMemberStatus.REVOKED}
                  onChange={(event) => updateMember(member.id, event.target.value as CampaignRole, false)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
                >
                  {Object.values(CampaignRole).map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                {member.status === CampaignMemberStatus.ACTIVE ? (
                  <Button size="sm" variant="destructive" disabled={isPending} onClick={() => updateMember(member.id, member.role, true)}>Thu hồi</Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => updateMember(member.id, member.role, false)}>Khôi phục</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Lời mời chưa đăng nhập</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invites.map((invite) => <div key={invite.id} className="flex justify-between border-b border-slate-100 py-2"><span>{invite.email}</span><span>{invite.role} · {invite.status}</span></div>)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
