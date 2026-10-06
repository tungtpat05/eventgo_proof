import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { SupabaseCampaignMemberRepository } from '@/infrastructure/repositories/supabase-campaign-member-repository';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  Tag,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { CampaignRole, CampaignStatus } from '@/domain/enums';
import { Badge } from '@/components/ui/badge';
import { CampaignActivationButton } from '@/features/booths/components/campaign-activation-button';
import { CampaignHierarchyView } from '@/features/campaigns/components/campaign-hierarchy-view';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;

  let campaign;
  try {
    campaign = await getCampaignDetailsUseCase(id);
  } catch {
    notFound();
  }

  const isManager = campaign.currentUserRole === CampaignRole.MANAGER;
  const isDraft = campaign.status === CampaignStatus.DRAFT;

  const [locations, members] = await Promise.all([
    new SupabaseLocationRepository().findByCampaign(id),
    isManager
      ? new SupabaseCampaignMemberRepository().findByCampaign(id)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>

      {/* Campaign Header Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                <Tag className="h-3 w-3" />
                {campaign.brandName}
              </span>
              <StatusBadge status={campaign.status} />
              <Badge variant="outline">{campaign.currentUserRole}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
            {campaign.description && (
              <p className="mt-2 text-sm text-slate-600 max-w-3xl">{campaign.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isManager && isDraft && (
              <CampaignActivationButton campaignId={campaign.id} />
            )}

            {isManager && (
              <Link href={`/campaigns/${campaign.id}/members`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" /> Quản lý thành viên
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Thời gian: <strong>{formatDate(campaign.startDate)}</strong> đến <strong>{formatDate(campaign.endDate)}</strong>
            </span>
          </div>
          <div>
            <span>Công ty: <strong>{campaign.companyName}</strong></span>
          </div>
        </div>
      </div>

      {/* Cấu trúc phân cấp Địa điểm -> Gian hàng -> Checklist & Phân công */}
      <CampaignHierarchyView
        campaignId={campaign.id}
        locations={locations}
        members={members}
        isManager={isManager}
      />
    </div>
  );
}
