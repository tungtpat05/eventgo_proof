'use client';

import React from 'react';
import Link from 'next/link';
import { Location, CampaignMember } from '@/domain/entities';
import { CampaignRole } from '@/domain/enums';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Store,
  UserCheck,
  ListChecks,
  PlusCircle,
  Clock,
  UserX,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { BoothDialog } from '@/features/booths/components/booth-dialog';
import { BoothAssignmentDialog } from '@/features/booths/components/booth-assignment-dialog';
import { BoothChecklistDialog } from '@/features/booths/components/booth-checklist-dialog';
import { deleteBoothAction } from '@/features/booths/actions/booth-actions';
import { useRouter } from 'next/navigation';

interface CampaignHierarchyViewProps {
  campaignId: string;
  locations: Location[];
  members: CampaignMember[];
  isManager: boolean;
}

export function CampaignHierarchyView({
  campaignId,
  locations,
  members,
  isManager,
}: CampaignHierarchyViewProps) {
  const router = useRouter();
  const supervisors = members.filter((m) => m.role === CampaignRole.SUPERVISOR && m.status === 'ACTIVE');
  const approvers = members.filter((m) => m.role === CampaignRole.APPROVER && m.status === 'ACTIVE');

  const handleDeleteBooth = async (boothId: string, locationId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gian hàng này cùng toàn bộ checklist của nó?')) return;
    const res = await deleteBoothAction(boothId, campaignId, locationId);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Xóa thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Cấu Trúc Triển Khai: Địa Điểm & Gian Hàng (Booths)
          </h2>
          <p className="text-xs text-slate-500">
            Mỗi địa điểm có thể gồm nhiều gian hàng. Mỗi gian hàng cần được cấu hình checklist riêng và phân công nhân sự.
          </p>
        </div>

        {isManager && locations.length > 0 && (
          <div className="flex items-center gap-2">
            <Link href={`/locations/new?campaignId=${campaignId}`}>
              <Button size="sm" className="flex items-center gap-1.5 text-xs">
                <PlusCircle className="h-3.5 w-3.5" />
                Thêm địa điểm mới
              </Button>
            </Link>
            <Link href={`/locations/import?campaignId=${campaignId}`}>
              <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Import Excel
              </Button>
            </Link>
          </div>
        )}
      </div>

      {locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center bg-white">
          <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">Chưa có địa điểm nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Hãy thêm địa điểm tổ chức (TTTM, siêu thị, đại lý) để bắt đầu thiết lập gian hàng.
          </p>
          {isManager && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={`/locations/new?campaignId=${campaignId}`}>
                <Button size="sm" className="flex items-center gap-1.5 text-xs">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Thêm địa điểm đầu tiên
                </Button>
              </Link>
              <Link href={`/locations/import?campaignId=${campaignId}`}>
                <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Import Excel
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {locations.map((loc) => {
            const booths = loc.booths || [];
            return (
              <Card key={loc.id} className="overflow-hidden border-slate-200 shadow-xs">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3.5 px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-slate-900">
                          {loc.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] bg-white">
                          {loc.city}
                        </Badge>
                        <span className="text-xs text-slate-400 font-medium">
                          ({booths.length} gian hàng)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>
                    </div>
                  </div>

                  {isManager && booths.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BoothDialog
                        locationId={loc.id}
                        campaignId={campaignId}
                        mode="create"
                      />
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-5">
                  {booths.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
                      <Store className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-slate-700">
                        Chưa có gian hàng nào tại địa điểm này
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                        Thêm booth hoặc quầy sampling để phân công nhân sự và cài đặt checklist
                      </p>
                      {isManager && (
                        <BoothDialog
                          locationId={loc.id}
                          campaignId={campaignId}
                          mode="create"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {booths.map((booth) => {
                        const hasSupervisor = Boolean(booth.supervisorMemberId);
                        const hasApprover = Boolean(booth.approverMemberId);

                        return (
                          <div
                            key={booth.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              {/* Header Booth */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">
                                      {booth.name}
                                    </span>
                                    {booth.code && (
                                      <Badge variant="secondary" className="text-[10px] font-mono">
                                        {booth.code}
                                      </Badge>
                                    )}
                                  </div>
                                  {booth.description && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                      {booth.description}
                                    </p>
                                  )}
                                </div>

                                {isManager && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <BoothDialog
                                      locationId={loc.id}
                                      campaignId={campaignId}
                                      booth={booth}
                                      mode="edit"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteBooth(booth.id, loc.id)}
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Personnel Assignments Info */}
                              <div className="rounded-lg bg-slate-50 p-2.5 space-y-2 border border-slate-100 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                                    Supervisor:
                                  </span>
                                  {hasSupervisor ? (
                                    <span className="font-semibold text-slate-800 bg-blue-50/80 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                      {booth.supervisorName || 'Đã phân công'}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      <UserX className="h-3 w-3" /> Chưa phân công
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Approver:
                                  </span>
                                  {hasApprover ? (
                                    <span className="font-semibold text-slate-800 bg-emerald-50/80 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                                      {booth.approverName || 'Đã phân công'}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      <UserX className="h-3 w-3" /> Chưa phân công
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Footer & Actions */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                {booth.deadline && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    {new Date(booth.deadline).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <BoothChecklistDialog
                                  boothId={booth.id}
                                  boothName={booth.name}
                                  campaignId={campaignId}
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50"
                                    >
                                      <ListChecks className="h-3.5 w-3.5 text-purple-600" />
                                      Checklist ({booth.checklistCount || 0})
                                    </Button>
                                  }
                                />

                                {isManager && (
                                  <BoothAssignmentDialog
                                    boothId={booth.id}
                                    boothName={booth.name}
                                    campaignId={campaignId}
                                    supervisors={supervisors}
                                    approvers={approvers}
                                    currentSupervisorMemberId={booth.supervisorMemberId}
                                    currentApproverMemberId={booth.approverMemberId}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
