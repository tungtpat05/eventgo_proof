import React from 'react';
import Link from 'next/link';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { CampaignCard } from '@/features/campaigns/components/campaign-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Megaphone } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý Chiến dịch — EventGo Proof',
};

export default async function CampaignsPage() {
  const campaigns = await getCampaignsUseCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chiến Dịch Nghiệm Thu</h1>
          <p className="text-sm text-slate-500">
            Quản lý các chương trình kích hoạt, thiết lập gian hàng và kiểm soát tuân thủ
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
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Chưa có chiến dịch nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Bắt đầu số hóa quy trình nghiệm thu bằng cách khởi tạo chiến dịch kích hoạt đầu tiên.
          </p>
          <Link href="/campaigns/new">
            <Button size="sm">Tạo chiến dịch</Button>
          </Link>
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
