'use client';

import React, { useState } from 'react';
import { Submission, Location, ChecklistItem } from '@/domain/entities';
import { ApprovalAction } from '@/domain/enums';
import { reviewSubmissionAction } from '@/features/submissions/actions/submission-actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, History, MessageSquare, ZoomIn, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReviewPanelProps {
  submission: Submission;
  location?: Location | null;
  checklistItem?: ChecklistItem | null;
  boothName?: string | null;
  campaignId?: string;
}

export function ReviewPanel({ submission, location, checklistItem, boothName, campaignId }: ReviewPanelProps) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReview = async (action: ApprovalAction) => {
    if (action === ApprovalAction.REQUEST_REVISION && (!revisionNotes || revisionNotes.trim().length === 0)) {
      setErrorMsg('Vui lòng nhập lý do cụ thể khi yêu cầu chỉnh sửa/chụp lại ảnh.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await reviewSubmissionAction(
      submission.id,
      action,
      action === ApprovalAction.REQUEST_REVISION ? revisionNotes : 'Đã kiểm tra đạt yêu cầu.',
      campaignId
    );

    setIsProcessing(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(
        action === ApprovalAction.APPROVE
          ? 'Đã duyệt đạt bằng chứng thành công!'
          : 'Đã gửi yêu cầu chỉnh sửa đến giám sát viên.'
      );
      setRevisionNotes('');
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Lightbox / High-res photo zoom */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto}
              alt="Phóng to bằng chứng"
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl object-contain"
            />
            <p className="text-center text-xs text-white/80 mt-2">Nhấn bất kỳ đâu để đóng</p>
          </div>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Store className="h-3 w-3" />
                {boothName || location?.name || 'Gian hàng sự kiện'}
              </span>
              {location && (
                <span className="text-xs text-slate-500">
                  tại {location.name} ({location.city})
                </span>
              )}
              <StatusBadge status={submission.status} />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              {checklistItem?.title || 'Tiêu chí nghiệm thu'}
            </CardTitle>
          </div>

          <div className="text-xs text-slate-500">
            Nộp lúc: <strong>{formatDateTime(submission.submittedAt)}</strong>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              {successMsg}
            </div>
          )}

          {/* Evidence Photos Gallery */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Hình ảnh bằng chứng hiện trường ({submission.evidence?.length || 0} ảnh)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {submission.evidence?.map((evi, idx) => (
                <div
                  key={evi.id}
                  onClick={() => setActivePhoto(evi.imageUrl)}
                  className="relative aspect-video sm:aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer group shadow-xs hover:border-blue-400 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={evi.imageUrl}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <ZoomIn className="h-6 w-6" />
                  </div>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">
                    Ảnh #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Supervisor Notes */}
          {submission.notes && (
            <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                Ghi chú từ hiện trường:
              </span>
              <p className="text-slate-600 pl-5">{submission.notes}</p>
            </div>
          )}

          {/* Review Actions Panel */}
          {submission.status !== 'APPROVED' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-800">
                Quyết định kiểm duyệt
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Ghi chú phê duyệt / Lý do yêu cầu chỉnh sửa (Bắt buộc khi yêu cầu sửa):
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={2}
                  placeholder="VD: Ảnh chụp logo bị lóa đèn sảnh, yêu cầu chụp lại góc nghiêng 45 độ..."
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button
                  type="button"
                  onClick={() => handleReview(ApprovalAction.APPROVE)}
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-xs h-9"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Duyệt Đạt (Approve)
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleReview(ApprovalAction.REQUEST_REVISION)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 text-xs h-9"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Yêu Cầu Chụp Lại (Revision)
                </Button>
              </div>
            </div>
          )}

          {/* Immutable Audit History Timeline */}
          {submission.history && submission.history.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-slate-400" />
                Lịch sử kiểm duyệt bất biến (Audit Trail)
              </h4>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                {submission.history.map((h) => (
                  <div key={h.id} className="p-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            h.action === ApprovalAction.APPROVE ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {h.action === ApprovalAction.APPROVE ? '✓ Đã Duyệt Đạt' : '✗ Yêu Cầu Chỉnh Sửa'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(h.createdAt)}
                        </span>
                      </div>
                      {h.notes && <p className="text-slate-600">{h.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
