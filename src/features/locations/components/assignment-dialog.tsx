'use client';

import React, { useState } from 'react';
import { assignPersonnelAction } from '../actions/location-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { CampaignMember } from '@/domain/entities';

export interface AssignmentPanelProps {
  locationId: string;
  supervisors?: CampaignMember[];
  approvers?: CampaignMember[];
  currentSupervisorMemberId?: string | null;
  currentApproverMemberId?: string | null;
  currentDeadline?: string | null;
}

export function AssignmentPanel({
  locationId,
  supervisors = [],
  approvers = [],
  currentSupervisorMemberId,
  currentApproverMemberId,
  currentDeadline,
}: AssignmentPanelProps) {
  const [supervisorMemberId, setSupervisorMemberId] = useState(currentSupervisorMemberId || '');
  const [approverMemberId, setApproverMemberId] = useState(currentApproverMemberId || '');
  const [deadline, setDeadline] = useState(currentDeadline || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const res = await assignPersonnelAction(
      locationId,
      supervisorMemberId || null,
      approverMemberId || null,
      deadline || null
    );
    setIsLoading(false);

    if (res.success) {
      setMessage({ text: 'Đã cập nhật phân công nhân sự thành công!' });
    } else {
      setMessage({ text: res.error || 'Lỗi cập nhật', isError: true });
    }
  };

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <UserCheck className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-slate-900 text-sm">Phân Công Nhân Sự Phụ Trách</h3>
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${
            message.isError
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {!message.isError && <CheckCircle2 className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase text-slate-700">
          Giám sát hiện trường (Site Supervisor)
        </label>
        <select
          value={supervisorMemberId}
          onChange={(e) => setSupervisorMemberId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <option value="">-- Chưa phân công --</option>
          {supervisors.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName} ({member.email})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase text-slate-700">
          Người kiểm duyệt (Approver)
        </label>
        <select
          value={approverMemberId}
          onChange={(e) => setApproverMemberId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <option value="">-- Chưa phân công --</option>
          {approvers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName} ({member.email})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase text-slate-700">
          Hạn chót nghiệm thu (Deadline)
        </label>
        <Input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      <Button type="submit" size="sm" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang cập nhật...
          </>
        ) : (
          'Lưu phân công nhân sự'
        )}
      </Button>
    </form>
  );
}
