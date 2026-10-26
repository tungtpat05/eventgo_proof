'use client';

import React, { useState } from 'react';
import { Booth, ChecklistItem, Submission } from '@/domain/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CameraUploader, CapturedPhoto } from '@/features/evidence/components/camera-uploader';
import { submitEvidenceAction } from '@/features/submissions/actions/submission-actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface BoothSupervisionCardProps {
  booth: Booth;
  locationName: string;
  locationAddress: string;
  checklistItems: ChecklistItem[];
  submissions: Submission[];
  campaignId: string;
}

export function BoothSupervisionCard({
  booth,
  locationName,
  locationAddress,
  checklistItems,
  submissions,
  campaignId,
}: BoothSupervisionCardProps) {
  const router = useRouter();
  const t = useTranslations('operations.supervision');

  const [activeItem, setActiveItem] = useState<ChecklistItem | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);

  const submissionByChecklist = new Map(
    submissions.map((s) => [s.checklistItemId, s])
  );

  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;
  const totalCount = checklistItems.length;
  const progressPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const handleOpenSubmit = (item: ChecklistItem) => {
    setActiveItem(item);
    setPhotos([]);
    setNotes('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (photos.length === 0) {
      setErrorMessage(t('errNeedAtLeastOnePhoto'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitEvidenceAction(
      booth.id,
      activeItem.id,
      notes,
      JSON.stringify(photos),
      campaignId
    );

    setIsSubmitting(false);

    if (res.success) {
      setActiveItem(null);
      router.refresh();
    } else {
      setErrorMessage(res.error || t('errSubmitFailed'));
    }
  };

  return (
    <Card className="border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-600 shrink-0" />
              <CardTitle className="text-base font-bold text-slate-900">{booth.name}</CardTitle>
              {booth.code && (
                <Badge variant="outline" className="text-[10px] bg-white font-mono">
                  {booth.code}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {locationName} — {locationAddress}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-blue-600">
              {t('boothCardPassed', { approved: approvedCount, total: totalCount })}
            </span>
            <div className="w-20 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {checklistItems.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            {t('boothCardEmptyChecklist')}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {checklistItems.map((item, idx) => {
              const sub = submissionByChecklist.get(item.id);
              const status = sub?.status || 'DRAFT';

              return (
                <div
                  key={item.id}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        #{idx + 1}. {item.title}
                      </span>
                      {status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> {t('statusApproved')}
                        </span>
                      )}
                      {status === 'SUBMITTED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="h-3 w-3" /> {t('statusSubmitted')}
                        </span>
                      )}
                      {status === 'NEEDS_REVISION' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <AlertCircle className="h-3 w-3" /> {t('statusNeedsRevision')}
                        </span>
                      )}
                      {status === 'DRAFT' && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {t('statusDraft')}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400">{item.description}</p>
                    )}

                    {/* Show revision notes if needed */}
                    {status === 'NEEDS_REVISION' && sub?.history?.[0]?.notes && (
                      <div className="mt-1 p-2 rounded bg-red-50 border border-red-100 text-[11px] text-red-700">
                        <strong>{t('approverNotesLabel')}</strong> {sub.history[0].notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sub && sub.evidence && sub.evidence.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewSubmission(sub)}
                        className="h-8 text-xs text-slate-500 hover:text-slate-800 gap-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t('btnViewEvidence', { count: sub.evidence.length })}
                      </Button>
                    )}

                    {status !== 'APPROVED' && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenSubmit(item)}
                        className={`h-8 text-xs gap-1.5 cursor-pointer ${
                          status === 'NEEDS_REVISION'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {status === 'DRAFT' ? t('btnCapture') : t('btnRecapture')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal Nộp Evidence */}
      <Dialog open={Boolean(activeItem)} onOpenChange={(open: boolean) => !open && setActiveItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              {t('modalSubmitTitle', { title: activeItem?.title || '' })}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {t('modalSubmitDesc', { booth: booth.name, location: locationName })}
            </DialogDescription>
          </DialogHeader>

          {activeItem && (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              {activeItem.description && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800">
                  <strong>{t('standardRequirementLabel')}</strong> {activeItem.description}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700">
                  {t('evidencePhotosLabel', { max: 5 })}
                </label>
                <CameraUploader photos={photos} onPhotosChange={setPhotos} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700">
                  {t('fieldNotesLabel')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t('fieldNotesPlaceholder')}
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveItem(null)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {t('btnCancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || photos.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {isSubmitting ? t('btnSubmitting') : t('btnConfirmSubmit')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Xem Evidence đã nộp */}
      <Dialog open={Boolean(viewSubmission)} onOpenChange={(open: boolean) => !open && setViewSubmission(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {t('modalViewTitle')}
            </DialogTitle>
          </DialogHeader>

          {viewSubmission && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {viewSubmission.evidence?.map((ev) => (
                  <div
                    key={ev.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ev.imageUrl}
                      alt="Evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {viewSubmission.notes && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                  <strong>{t('notesLabel')}</strong> {viewSubmission.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
