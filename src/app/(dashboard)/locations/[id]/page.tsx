import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocationDetailsUseCase } from '@/application/use-cases/locations/get-location-details';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  User,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { id } = await params;

  let location;
  let campaign;
  try {
    location = await getLocationDetailsUseCase(id);
    campaign = await getCampaignDetailsUseCase(location.campaignId);
  } catch {
    notFound();
  }

  // Master criteria for this location
  const standardCriteria = [
    {
      id: 'crit-1',
      title: 'Lắp đặt gian hàng theo thiết kế 3D',
      desc: 'Chụp góc rộng toàn cảnh gian hàng từ phía trước và hai bên',
      status: 'APPROVED',
      isReq: true,
    },
    {
      id: 'crit-2',
      title: 'Vị trí logo nhận diện thương hiệu',
      desc: 'Chụp cận cảnh logo trên backdrop và quầy lễ tân',
      status: 'NEEDS_REVISION',
      isReq: true,
      revisionNote: 'Ảnh logo bị mờ và lóa đèn sảnh, vui lòng chụp lại rõ nét.',
    },
    {
      id: 'crit-3',
      title: 'Standee và POSM trưng bày',
      desc: 'Chụp các standee, tờ rơi, bảng giá tại khu vực tiếp đón',
      status: 'SUBMITTED',
      isReq: true,
    },
    {
      id: 'crit-4',
      title: 'Sản phẩm mẫu trưng bày đầy đủ',
      desc: 'Chụp cận cảnh quầy kệ sản phẩm mẫu và quà tặng dùng thử',
      status: 'DRAFT',
      isReq: true,
    },
    {
      id: 'crit-5',
      title: 'Nhân sự trực quầy (PG/PB)',
      desc: 'Chụp nhân viên trực quầy trong trang phục tiêu chuẩn của sự kiện',
      status: 'DRAFT',
      isReq: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/locations?campaignId=${location.campaignId}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách địa điểm
          </Button>
        </Link>
      </div>

      {/* Location Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Chiến dịch: {campaign.title}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {location.city}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{location.name}</h1>
            <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              {location.address}
            </p>
          </div>

          <Link href={`/locations/${location.id}/submit`}>
            <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Camera className="h-4 w-4" />
              Chụp & Nộp bằng chứng
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>Hạn chót: <strong>{formatDateTime(location.deadline)}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-slate-400" />
            <span>Giám sát phụ trách: <strong>Nguyễn Văn Giám Sát</strong></span>
          </div>
        </div>
      </div>

      {/* Checklist Verification Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Tiến Độ Nghiệm Thu Tiêu Chí (Checklist)
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Tất cả các tiêu chí phải được duyệt đạt để hoàn thành nghiệm thu địa điểm này
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Tiến độ: 1 / 5 Đạt
          </span>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="divide-y divide-slate-100">
            {standardCriteria.map((item, idx) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                    {item.isReq && (
                      <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.2 rounded">
                        Bắt buộc
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                  {item.revisionNote && (
                    <div className="rounded bg-red-50 p-2 text-xs text-red-600 border border-red-200 mt-1 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span><strong>Lý do yêu cầu sửa:</strong> {item.revisionNote}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đã duyệt đạt
                    </span>
                  )}
                  {item.status === 'NEEDS_REVISION' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Cần chụp lại
                    </span>
                  )}
                  {item.status === 'SUBMITTED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      Đang chờ duyệt
                    </span>
                  )}
                  {item.status === 'DRAFT' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      Chưa nộp ảnh
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
