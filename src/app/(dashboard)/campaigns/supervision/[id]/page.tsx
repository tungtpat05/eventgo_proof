import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { SupabaseBoothRepository } from '@/infrastructure/repositories/supabase-booth-repository';
import { SupabaseChecklistRepository } from '@/infrastructure/repositories/supabase-checklist-repository';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLeft, Tag, ScanEye, Store } from 'lucide-react';
import { BoothSupervisionCard } from '@/features/supervision/components/booth-supervision-card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giám Sát Chiến Dịch — EventGo Proof',
};

interface SupervisionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupervisionDetailPage({ params }: SupervisionDetailPageProps) {
  const { id } = await params;
  const session = await getCurrentUserSession();
  if (!session) redirect('/login');

  let campaign;
  try {
    campaign = await getCampaignDetailsUseCase(id);
  } catch {
    notFound();
  }

  // Lấy member id của user trong campaign này
  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from('campaign_members')
    .select('id, role, status')
    .eq('campaign_id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!member || member.status !== 'ACTIVE' || member.role !== 'SUPERVISOR') {
    notFound();
  }

  // Lấy tất cả booth mà supervisor này được phân công trong campaign
  const { data: assignments } = await supabase
    .from('booth_supervisor_assignments')
    .select(`
      booth_id,
      booths(
        id, location_id, name, code, description, deadline, created_at, updated_at,
        locations(id, campaign_id, name, address, city)
      )
    `)
    .eq('supervisor_member_id', member.id);

  // Lọc chỉ những booth thuộc campaign hiện tại
  const assignedBooths = (assignments || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => a.booths)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b && b.locations && b.locations.campaign_id === id);

  const boothRepo = new SupabaseBoothRepository();
  const checklistRepo = new SupabaseChecklistRepository();
  const submissionRepo = new SupabaseSubmissionRepository();

  // Load checklist items và submissions cho từng booth
  const boothsWithData = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignedBooths.map(async (b: any) => {
      const [fullBooth, checklistItems, submissions] = await Promise.all([
        boothRepo.findById(b.id),
        checklistRepo.findByBooth(b.id),
        submissionRepo.findByBooth(b.id),
      ]);
      return {
        booth: fullBooth!,
        locationName: b.locations.name,
        locationAddress: `${b.locations.address}, ${b.locations.city}`,
        checklistItems,
        submissions,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/campaigns/supervision">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách giám sát
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
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                <ScanEye className="h-3 w-3" /> Quyền Supervisor
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              Bạn đang phụ trách {boothsWithData.length} gian hàng kích hoạt tại chiến dịch này.
            </p>
          </div>
        </div>
      </div>

      {/* Danh sách các Booth được phân công */}
      {boothsWithData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <Store className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">
            Chưa có gian hàng nào được phân công cho bạn
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Vui lòng liên hệ Quản lý chiến dịch (Manager) để được gán phụ trách booth tại các địa điểm.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Gian Hàng Được Phân Công ({boothsWithData.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boothsWithData.map((item) => (
              <BoothSupervisionCard
                key={item.booth.id}
                booth={item.booth}
                locationName={item.locationName}
                locationAddress={item.locationAddress}
                checklistItems={item.checklistItems}
                submissions={item.submissions}
                campaignId={campaign.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
