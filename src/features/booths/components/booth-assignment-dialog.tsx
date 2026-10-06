'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { UserCheck, Loader2 } from 'lucide-react';
import { assignBoothPersonnelAction } from '@/features/booths/actions/booth-actions';
import { useRouter } from 'next/navigation';
import { CampaignMember } from '@/domain/entities';

interface BoothAssignmentDialogProps {
  boothId: string;
  boothName: string;
  campaignId: string;
  supervisors: CampaignMember[];
  approvers: CampaignMember[];
  currentSupervisorMemberId?: string | null;
  currentApproverMemberId?: string | null;
  trigger?: React.ReactNode;
}

export function BoothAssignmentDialog({
  boothId,
  boothName,
  campaignId,
  supervisors,
  approvers,
  currentSupervisorMemberId,
  currentApproverMemberId,
  trigger,
}: BoothAssignmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supervisorId, setSupervisorId] = useState(currentSupervisorMemberId || '');
  const [approverId, setApproverId] = useState(currentApproverMemberId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('boothId', boothId);
    formData.append('campaignId', campaignId);
    formData.append('supervisorMemberId', supervisorId);
    formData.append('approverMemberId', approverId);

    const res = await assignBoothPersonnelAction(null, formData);
    setLoading(false);

    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error || 'Phân công nhân sự thất bại.');
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="h-7 text-xs gap-1">
          <UserCheck className="h-3.5 w-3.5" />
          Phân công
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Phân công nhân sự cho {boothName}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Giám sát viên hiện trường (Supervisor)
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
              >
                <option value="">-- Chưa phân công --</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName || s.email} ({s.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Supervisor sẽ chịu trách nhiệm chụp và nộp ảnh bằng chứng của gian hàng này.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Người phê duyệt (Approver)
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
              >
                <option value="">-- Chưa phân công --</option>
                {approvers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName || a.email} ({a.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Approver sẽ nhận thông báo duyệt khi Supervisor hoàn tất nghiệm thu.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Lưu phân công
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
