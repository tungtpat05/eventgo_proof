'use client';

import { useState, useTransition } from 'react';
import { CampaignMember } from '@/domain/entities';
import { assignSubmissionApproverAction } from '../actions/location-actions';

interface SubmissionApproverSelectProps {
  campaignId: string;
  submissionId: string;
  currentApproverMemberId: string;
  approvers: CampaignMember[];
}

export function SubmissionApproverSelect({
  campaignId,
  submissionId,
  currentApproverMemberId,
  approvers,
}: SubmissionApproverSelectProps) {
  const [value, setValue] = useState(currentApproverMemberId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <select
        value={value}
        disabled={pending}
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          setError(null);
          startTransition(async () => {
            const result = await assignSubmissionApproverAction(campaignId, submissionId, nextValue);
            if (result.error) {
              setValue(currentApproverMemberId);
              setError(result.error);
            }
          });
        }}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
      >
        {approvers.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
      </select>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
