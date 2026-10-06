import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { SupabaseChecklistRepository } from '@/infrastructure/repositories/supabase-checklist-repository';
import { SupabaseBoothRepository } from '@/infrastructure/repositories/supabase-booth-repository';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLeft, Tag, CheckCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ReviewPanel } from '@/features/approvals/components/review-panel';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phê Duyệt Chiến Dịch — EventGo Proof',
};

interface ApprovalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApprovalDetailPage({ params }: ApprovalDetailPageProps) {
  const { id } = await params;
  const session = await getCurrentUserSession();
  if (!session) redirect('/login');

  let campaign;
  try {
    campaign = await getCampaignDetailsUseCase(id);
  } catch {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from('campaign_members')
    .select('id, role, status')
    .eq('campaign_id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!member || member.status !== 'ACTIVE' || member.role !== 'APPROVER') {
    notFound();
  }

  // Tìm tất cả booth mà approver này được phân công trong chiến dịch
  const { data: assignments } = await supabase
    .from('booth_approver_assignments')
    .select(`
      booth_id,
      booths(
        id, location_id, name, code, description, deadline, created_at, updated_at,
        locations(id, campaign_id, name, address, city)
      )
    `)
    .eq('approver_member_id', member.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedBooths = (assignments || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => a.booths)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b && b.locations && b.locations.campaign_id === id);

  const boothIds = assignedBooths.map((b) => b.id);

  const subRepo = new SupabaseSubmissionRepository();
  const checklistRepo = new SupabaseChecklistRepository();
  const boothRepo = new SupabaseBoothRepository();

  // Load submissions for all assigned booths
  const allSubmissions = (
    await Promise.all(boothIds.map((bId) => subRepo.findByBooth(bId)))
  ).flat();

  // Load criteria & booth mapping
  const enrichedSubmissions = await Promise.all(
    allSubmissions.map(async (sub) => {
      const [booth, checklistItems] = await Promise.all([
        boothRepo.findById(sub.boothId),
        checklistRepo.findByBooth(sub.boothId),
      ]);
      const checklistItem = checklistItems.find((ci) => ci.id === sub.checklistItemId) || null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assignedBoothObj = assignedBooths.find((b: any) => b.id === sub.boothId);
      const location = assignedBoothObj?.locations || null;

      return {
        submission: sub,
        booth,
        boothName: booth?.name || 'Gian hàng',
        checklistItem,
        location,
      };
    })
  );

  const pendingList = enrichedSubmissions.filter((s) => s.submission.status === 'SUBMITTED');
  const revisionList = enrichedSubmissions.filter((s) => s.submission.status === 'NEEDS_REVISION');
  const approvedList = enrichedSubmissions.filter((s) => s.submission.status === 'APPROVED');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/campaigns/approvals">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách phê duyệt
          </Button>
        </Link>
      </div>

      {/* Campaign Banner Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                <Tag className="h-3 w-3" />
                {campaign.brandName}
              </span>
              <StatusBadge status={campaign.status} />
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <CheckCheck className="h-3 w-3" /> Quyền Approver
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              Bạn đang phụ trách thẩm định và duyệt cho {assignedBooths.length} gian hàng kích hoạt.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>{pendingList.length} bài nộp chờ duyệt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Submissions Sections */}
      <div className="space-y-6">
        {/* 1. Nhóm bài nộp cần duyệt gấp (Pending Reviews) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Hồ Sơ Đang Chờ Phê Duyệt ({pendingList.length})
            </h2>
          </div>

          {pendingList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-white">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">
                Không có hồ sơ nào đang chờ duyệt
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Các giám sát viên chưa nộp thêm bằng chứng mới hoặc bạn đã duyệt hết các hồ sơ.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingList.map(({ submission, location, checklistItem, boothName }) => (
                <ReviewPanel
                  key={submission.id}
                  submission={submission}
                  location={location}
                  checklistItem={checklistItem}
                  boothName={boothName}
                  campaignId={campaign.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* 2. Nhóm bài nộp đã yêu cầu chỉnh sửa (Needs Revision) */}
        {revisionList.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Đang Chờ Giám Sát Chụp Lại / Bổ Sung ({revisionList.length})
            </h2>

            <div className="space-y-6">
              {revisionList.map(({ submission, location, checklistItem, boothName }) => (
                <ReviewPanel
                  key={submission.id}
                  submission={submission}
                  location={location}
                  checklistItem={checklistItem}
                  boothName={boothName}
                  campaignId={campaign.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. Nhóm bài nộp đã duyệt đạt (Approved) */}
        {approvedList.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Đã Phê Duyệt Đạt Chuẩn ({approvedList.length})
            </h2>

            <div className="space-y-6">
              {approvedList.map(({ submission, location, checklistItem, boothName }) => (
                <ReviewPanel
                  key={submission.id}
                  submission={submission}
                  location={location}
                  checklistItem={checklistItem}
                  boothName={boothName}
                  campaignId={campaign.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
