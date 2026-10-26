'use client';

import React, { useState } from 'react';
import { CampaignPersonnelItem } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import {
  cancelCampaignInviteAction,
  revokeCampaignMemberAction,
} from '@/features/campaigns/actions/member-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, UserX, Store, MapPin, Loader2 } from 'lucide-react';

export interface PersonnelConfirmRevokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: CampaignPersonnelItem | null;
  campaignId: string;
  onSuccess: (message: string) => void;
}

export function PersonnelConfirmRevokeModal({
  isOpen,
  onClose,
  personnel,
  campaignId,
  onSuccess,
}: PersonnelConfirmRevokeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !personnel) return null;

  const isPending = personnel.isPending;
  const hasAssignedBooths = personnel.assignedBooths.length > 0;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isPending) {
        // Hủy lời mời
        const res = await cancelCampaignInviteAction(campaignId, personnel.rawId);
        if (res.error) {
          setError(res.error);
        } else {
          onSuccess(res.success || 'Đã thu hồi lời mời thành công.');
          onClose();
        }
      } else {
        // Xóa thành viên
        const res = await revokeCampaignMemberAction(campaignId, personnel.rawId, personnel.role);
        if (res.error) {
          setError(res.error);
        } else {
          onSuccess(res.success || 'Đã xóa thành viên khỏi chiến dịch.');
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý yêu cầu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                {isPending ? 'Thu hồi lời mời tham gia' : 'Xóa thành viên khỏi chiến dịch'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {isPending
                  ? `Vô hiệu hóa lời mời gửi tới ${personnel.email}`
                  : `Thu hồi quyền hạn của ${personnel.fullName || personnel.email}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Nhân sự:</span>
              <span className="font-bold text-slate-900">{personnel.fullName || personnel.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Email:</span>
              <span className="font-mono text-slate-700">{personnel.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Vai trò:</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {personnel.role}
              </span>
            </div>
          </div>

          {/* Cảnh báo các booth bị ảnh hưởng */}
          {hasAssignedBooths ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2.5">
              <div className="flex items-start gap-2 text-amber-900 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Nhân sự này đang phụ trách {personnel.assignedBooths.length} gian hàng:
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pl-6 pr-1">
                {personnel.assignedBooths.map((b) => (
                  <div
                    key={`${b.boothId}-${b.role}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200/80 text-[11px]"
                  >
                    <div className="min-w-0 flex-1 truncate pr-2">
                      <div className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                        <Store className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{b.boothName}</span>
                        {b.boothCode && (
                          <span className="text-[10px] text-slate-400 font-mono">({b.boothCode})</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{b.locationName}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-amber-800 bg-amber-100/60 px-1.5 py-0.5 rounded">
                      {b.role}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed pt-1 border-t border-amber-200/60">
                Nếu bạn xác nhận, toàn bộ các gian hàng trên sẽ tự động chuyển về trạng thái{' '}
                <strong>Chưa phân công</strong> và cần được gán nhân sự thay thế.
              </p>
            </div>
          ) : (
            <p className="text-slate-500 leading-relaxed">
              Nhân sự này hiện chưa được phân công phụ trách gian hàng nào. Việc xóa sẽ không làm gián đoạn
              hoạt động của các gian hàng trong chiến dịch.
            </p>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onClose}
            className="text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={handleConfirm}
            className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang xử lý...
              </>
            ) : isPending ? (
              'Xác nhận thu hồi lời mời'
            ) : (
              'Xác nhận xóa & Gỡ phân công'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
