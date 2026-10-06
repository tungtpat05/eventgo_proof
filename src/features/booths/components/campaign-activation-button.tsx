'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle2, AlertTriangle, Loader2, PlayCircle } from 'lucide-react';
import { checkCampaignActivationAction, activateCampaignAction } from '@/features/booths/actions/booth-actions';
import { useRouter } from 'next/navigation';

interface CampaignActivationButtonProps {
  campaignId: string;
}

export function CampaignActivationButton({ campaignId }: CampaignActivationButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [canActivate, setCanActivate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenCheck = async () => {
    setIsChecking(true);
    setActionError(null);
    setIsOpen(true);

    try {
      const result = await checkCampaignActivationAction(campaignId);
      setCanActivate(result.canActivate);
      setErrors(result.errors);
    } catch {
      setCanActivate(false);
      setErrors(['Không thể kết nối đến máy chủ để kiểm tra điều kiện.']);
    } finally {
      setIsChecking(false);
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    setActionError(null);

    const res = await activateCampaignAction(campaignId);
    setIsActivating(false);

    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setActionError(res.error || 'Kích hoạt chiến dịch thất bại.');
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenCheck}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
        size="sm"
      >
        <PlayCircle className="h-4 w-4" />
        Kích hoạt chiến dịch
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              {isChecking ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  Đang kiểm tra điều kiện kích hoạt...
                </>
              ) : canActivate ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Sẵn sàng kích hoạt chiến dịch
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Chưa đủ điều kiện kích hoạt
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {canActivate
                ? 'Toàn bộ địa điểm, gian hàng, checklist và phân công nhân sự đã đạt chuẩn.'
                : 'Để kích hoạt chiến dịch chạy chính thức (ACTIVE), vui lòng hoàn thiện các hạng mục sau:'}
            </DialogDescription>
          </DialogHeader>

          {isChecking ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-xs">Đang kiểm tra cấu trúc Booth & Checklist...</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                  {actionError}
                </div>
              )}

              {!canActivate && errors.length > 0 && (
                <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-3 space-y-1.5 max-h-60 overflow-y-auto">
                  {errors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-900">
                      <span className="font-bold text-amber-600">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {canActivate && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-2">
                  <p className="font-semibold">Bạn có chắc chắn muốn kích hoạt chiến dịch này?</p>
                  <p className="text-emerald-700 leading-relaxed">
                    Sau khi kích hoạt, các Giám sát viên (Supervisor) sẽ bắt đầu nộp được evidence nghiệm thu và Người phê duyệt (Approver) có thể tiến hành đánh giá.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} disabled={isActivating}>
              Đóng
            </Button>
            {canActivate && (
              <Button
                size="sm"
                onClick={handleActivate}
                disabled={isActivating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Đang kích hoạt...
                  </>
                ) : (
                  'Xác nhận kích hoạt'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
