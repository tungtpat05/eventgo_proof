import React from 'react';
import Link from 'next/link';
import { getManagedCampaignsUseCase } from '@/application/use-cases/campaigns/get-managed-campaigns';
import { CampaignCard } from '@/features/campaigns/components/campaign-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderKanban } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chiến Dịch Quản Lý — EventGo Proof',
};

export default async function ManagedCampaignsPage() {
  const campaigns = await getManagedCampaignsUseCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chiến Dịch Quản Lý</h1>
          <p className="text-sm text-slate-500">
            Các chiến dịch bạn có quyền Manager — Cấu hình địa điểm, gian hàng (booth), checklist và phân công nhân sự
          </p>
        </div>

        <Link href="/campaigns/new">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Tạo chiến dịch mới
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Chưa có chiến dịch quản lý nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Bắt đầu số hóa quy trình nghiệm thu bằng cách khởi tạo chiến dịch kích hoạt đầu tiên của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
