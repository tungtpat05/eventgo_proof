import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  Tag,
  MapPin,
  ListChecks,
  FileText,
  PlusCircle,
  FileSpreadsheet,
  ArrowLeft,
} from 'lucide-react';

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
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
            {campaign.description && (
              <p className="mt-2 text-sm text-slate-600 max-w-3xl">{campaign.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/reports?campaignId=${campaign.id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Biên bản nghiệm thu
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Thời gian: <strong>{formatDate(campaign.startDate)}</strong> đến <strong>{formatDate(campaign.endDate)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Campaign Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Locations Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                Địa Điểm Triển Khai
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/locations?campaignId=${campaign.id}`}>
                <Button size="sm" variant="outline" className="text-xs">
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Quản lý danh sách các gian hàng, điểm bán hoặc trung tâm thương mại tham gia kích hoạt trong chiến dịch này.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Link href={`/locations/new?campaignId=${campaign.id}`}>
                <Button size="sm" className="flex items-center gap-1 text-xs">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Thêm địa điểm
                </Button>
              </Link>
              <Link href={`/locations/import?campaignId=${campaign.id}`}>
                <Button size="sm" variant="secondary" className="flex items-center gap-1 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Import Excel / CSV
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                Bộ Tiêu Chí Nghiệm Thu
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Tiêu chuẩn hóa các hạng mục cần chụp ảnh và xác minh (Kết cấu gian hàng, Logo nhận diện, POSM, Trưng bày, Nhân sự trực quầy).
            </p>
            <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1 text-slate-600">
              <div>✓ Lắp đặt gian hàng theo phối cảnh 3D đã duyệt</div>
              <div>✓ Logo thương hiệu đúng quy chuẩn vị trí & góc nhìn</div>
              <div>✓ Standee & POSM đầy đủ theo layout</div>
              <div>✓ Sản phẩm trưng bày đủ số lượng</div>
              <div>✓ Nhân sự PG/PB có mặt đúng giờ, trang phục chuẩn</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
