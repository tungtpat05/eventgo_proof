import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocationDetailsUseCase } from '@/application/use-cases/locations/get-location-details';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { getChecklistItemsUseCase } from '@/application/use-cases/checklists/get-checklist-items';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { SupabaseCampaignMemberRepository } from '@/infrastructure/repositories/supabase-campaign-member-repository';
import { CampaignMemberStatus, CampaignRole, SubmissionStatus } from '@/domain/enums';
import { AssignmentPanel } from '@/features/locations/components/assignment-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { Camera, MapPin } from 'lucide-react';
import { SubmissionApproverSelect } from '@/features/locations/components/submission-approver-select';

interface LocationDetailPageProps { params: Promise<{ id: string }> }

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { id } = await params;
  const location = await getLocationDetailsUseCase(id).catch(() => notFound());
  const [campaign, checklistItems, submissions] = await Promise.all([
      getCampaignDetailsUseCase(location.campaignId),
      getChecklistItemsUseCase(location.campaignId),
      new SupabaseSubmissionRepository().findByLocation(id),
  ]).catch(() => notFound());
  const isManager = campaign.currentUserRole === CampaignRole.MANAGER;
  const isSupervisor = campaign.currentUserRole === CampaignRole.SUPERVISOR;
  const members = isManager
    ? await new SupabaseCampaignMemberRepository().findByCampaign(campaign.id)
    : [];
  const activeMembers = members.filter((member) => member.status === CampaignMemberStatus.ACTIVE);
  const approvers = activeMembers.filter((member) => member.role === CampaignRole.APPROVER);
  const submissionByChecklist = new Map(submissions.map((submission) => [submission.checklistItemId, submission]));

  return (
      <div className="space-y-6">
        <Link href={`/locations?campaignId=${campaign.id}`}><Button variant="ghost" size="sm">← Quay lại</Button></Link>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600">{campaign.title}</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{location.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4" />{location.address}, {location.city}</p>
              <p className="mt-2 text-xs text-slate-500">Deadline: {formatDateTime(location.deadline)}</p>
            </div>
            {isSupervisor && (
              <Link href={`/locations/${location.id}/submit`}><Button className="gap-2"><Camera className="h-4 w-4" />Nộp evidence</Button></Link>
            )}
          </div>
        </div>

        {isManager && (
          <AssignmentPanel
            locationId={location.id}
            supervisors={activeMembers.filter((member) => member.role === CampaignRole.SUPERVISOR)}
            approvers={approvers}
            currentSupervisorMemberId={location.supervisorMemberId}
            currentApproverMemberId={location.approverMemberId}
            currentDeadline={location.deadline ? location.deadline.toISOString().slice(0, 16) : null}
          />
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Checklist nghiệm thu</CardTitle></CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {checklistItems.map((item) => {
              const submission = submissionByChecklist.get(item.id);
              return (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{item.description}</p></div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{submission?.status || SubmissionStatus.DRAFT}</span>
                    {isManager && submission && approvers.length > 0 && submission.status !== SubmissionStatus.APPROVED && (
                      <SubmissionApproverSelect
                        campaignId={campaign.id}
                        submissionId={submission.id}
                        currentApproverMemberId={submission.assignedApproverMemberId}
                        approvers={approvers}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
  );
}
