import React from 'react';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { SupabaseChecklistRepository } from '@/infrastructure/repositories/supabase-checklist-repository';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { ReviewPanel } from '@/features/approvals/components/review-panel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phê duyệt nghiệm thu — EventGo Proof',
};

export default async function ApprovalsPage() {
  const session = await getCurrentUserSession();
  const subRepo = new SupabaseSubmissionRepository();
  const locRepo = new SupabaseLocationRepository();
  const checkRepo = new SupabaseChecklistRepository();

  const pendingSubmissions = await subRepo.findPendingReviews(session.user.organizationId);

  // Load locations and criteria details for pending items
  const fullSubmissions = await Promise.all(
    pendingSubmissions.map(async (sub) => {
      const location = await locRepo.findById(sub.locationId);
      const items = location ? await checkRepo.findByCampaign(location.campaignId) : [];
      const checklistItem = items.find((i) => i.id === sub.checklistItemId) || null;
      return { submission: sub, location, checklistItem };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Hàng Đợi Phê Duyệt (Review Queue)
        </h1>
        <p className="text-sm text-slate-500">
          Kiểm tra bằng chứng hiện trường, đánh giá mức độ tuân thủ và đưa ra quyết định duyệt hoặc yêu cầu chỉnh sửa
        </p>
      </div>

      {fullSubmissions.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Không có hồ sơ nào chờ duyệt</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Tất cả các bằng chứng nghiệm thu đã được xử lý hoặc giám sát viên chưa nộp thêm bằng chứng mới.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {fullSubmissions.map(({ submission, location, checklistItem }) => (
            <ReviewPanel
              key={submission.id}
              submission={submission}
              location={location}
              checklistItem={checklistItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
