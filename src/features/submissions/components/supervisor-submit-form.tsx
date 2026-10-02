'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CameraUploader, CapturedPhoto } from '@/features/evidence/components/camera-uploader';
import { submitEvidenceAction } from '../actions/submission-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, AlertCircle, Send, Loader2 } from 'lucide-react';
import { ChecklistItem, Location } from '@/domain/entities';

interface SupervisorSubmitFormProps {
  location: Location;
  checklistItems: ChecklistItem[];
}

export function SupervisorSubmitForm({ location, checklistItems }: SupervisorSubmitFormProps) {
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = useState(checklistItems[0]?.id || '');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const selectedItem = checklistItems.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      setMessage({ text: 'Vui lòng đính kèm ít nhất 1 ảnh bằng chứng trước khi nộp.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const res = await submitEvidenceAction(
      location.id,
      selectedItemId,
      notes,
      JSON.stringify(photos)
    );

    setIsSubmitting(false);

    if (res.error) {
      setMessage({ text: res.error, isError: true });
    } else {
      setMessage({ text: 'Đã nộp bằng chứng thành công! Đang chuyển hướng...' });
      setTimeout(() => {
        router.push(`/locations/${location.id}`);
      }, 1200);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      <div className="flex items-center gap-2">
        <Link href={`/locations/${location.id}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại chi tiết địa điểm
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200 shadow-md">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {location.city} — Hiện Trường
          </span>
          <CardTitle className="text-lg font-bold text-slate-900">{location.name}</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Chọn tiêu chí nghiệm thu và chụp ảnh thực tế tại gian hàng để nộp duyệt.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            {message && (
              <div
                className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${
                  message.isError
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {message.isError ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Select Checklist Item */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700">
                Tiêu chí cần nộp bằng chứng *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setPhotos([]);
                  setNotes('');
                }}
                className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 font-medium text-slate-900"
              >
                {checklistItems.map((item, idx) => (
                  <option key={item.id} value={item.id}>
                    #{idx + 1}. {item.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedItem?.description && (
              <div className="rounded-lg bg-blue-50/60 p-3 text-xs text-blue-800 border border-blue-100">
                <strong>Yêu cầu tiêu chuẩn:</strong> {selectedItem.description}
              </div>
            )}

            {/* Camera / Photo Uploader */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700">
                Ảnh bằng chứng thực tế * (Tối đa 5 ảnh)
              </label>
              <CameraUploader photos={photos} onPhotosChange={setPhotos} />
            </div>

            {/* Field Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700">
                Ghi chú của Giám sát (Tùy chọn)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Nhập tình hình thực tế, thời điểm chụp hoặc ghi chú cho người duyệt..."
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || photos.length === 0}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang nộp hồ sơ nghiệm thu...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Nộp Bằng Chứng Nghiệm Thu ({photos.length} ảnh)
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
