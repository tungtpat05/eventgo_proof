'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PlusCircle, Edit3, Loader2 } from 'lucide-react';
import { createBoothAction, updateBoothAction } from '@/features/booths/actions/booth-actions';
import { useRouter } from 'next/navigation';
import { Booth } from '@/domain/entities';

interface BoothDialogProps {
  locationId: string;
  campaignId: string;
  booth?: Booth;
  mode?: 'create' | 'edit';
  trigger?: React.ReactNode;
}

export function BoothDialog({
  locationId,
  campaignId,
  booth,
  mode = 'create',
  trigger,
}: BoothDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(booth?.name || '');
  const [code, setCode] = useState(booth?.code || '');
  const [description, setDescription] = useState(booth?.description || '');
  const [deadline, setDeadline] = useState(
    booth?.deadline ? new Date(booth.deadline).toISOString().slice(0, 16) : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('locationId', locationId);
    formData.append('campaignId', campaignId);
    formData.append('name', name);
    formData.append('code', code);
    formData.append('description', description);
    formData.append('deadline', deadline);

    if (mode === 'edit' && booth) {
      formData.append('id', booth.id);
      const res = await updateBoothAction(null, formData);
      setLoading(false);
      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error || 'Cập nhật thất bại.');
      }
    } else {
      const res = await createBoothAction(null, formData);
      setLoading(false);
      if (res.success) {
        setName('');
        setCode('');
        setDescription('');
        setDeadline('');
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error || 'Tạo gian hàng thất bại.');
      }
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : mode === 'edit' ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-8 px-2 text-slate-600">
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs">
          <PlusCircle className="h-3.5 w-3.5" />
          Thêm gian hàng (Booth)
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {mode === 'edit' ? 'Chỉnh sửa Gian hàng (Booth)' : 'Thêm Gian hàng mới (Booth)'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Tên gian hàng / vị trí <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="VD: Gian hàng chính - Sảnh A, Quầy Sampling tầng 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Mã gian hàng (Code)</label>
                <Input
                  placeholder="VD: BOOTH-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Hạn nghiệm thu</label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mô tả vị trí & hạng mục</label>
              <Input
                placeholder="VD: Đặt gần cổng vào siêu thị, yêu cầu chụp góc rộng..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {mode === 'edit' ? 'Lưu thay đổi' : 'Tạo gian hàng'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
