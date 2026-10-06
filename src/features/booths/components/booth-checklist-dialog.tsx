'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ListChecks, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  createChecklistItemAction,
  deleteChecklistItemAction,
  getBoothChecklistItemsAction,
} from '@/features/checklists/actions/checklist-actions';
import { ChecklistItem } from '@/domain/entities';
import { ChecklistCategory } from '@/domain/enums';
import { useRouter } from 'next/navigation';

interface BoothChecklistDialogProps {
  boothId: string;
  boothName: string;
  campaignId: string;
  trigger?: React.ReactNode;
}

export function BoothChecklistDialog({
  boothId,
  boothName,
  campaignId,
  trigger,
}: BoothChecklistDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistCategory>(ChecklistCategory.STRUCTURE);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const res = await getBoothChecklistItemsAction(boothId);
    setItems(res.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open, boothId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAdding(true);
    setError(null);

    const formData = new FormData();
    formData.append('boothId', boothId);
    formData.append('campaignId', campaignId);
    formData.append('title', newTitle.trim());
    formData.append('description', newDesc.trim());
    formData.append('category', newCategory);
    formData.append('isRequired', 'true');

    const res = await createChecklistItemAction(formData);
    setAdding(false);

    if (res.success) {
      setNewTitle('');
      setNewDesc('');
      fetchItems();
      router.refresh();
    } else {
      setError(res.error || 'Thêm tiêu chí thất bại.');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tiêu chí này?')) return;
    await deleteChecklistItemAction(itemId, campaignId);
    fetchItems();
    router.refresh();
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="h-7 text-xs gap-1">
          <ListChecks className="h-3.5 w-3.5 text-purple-600" />
          Checklist
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ListChecks className="h-5 w-5 text-purple-600" />
              Checklist tiêu chí — {boothName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            {/* List existing items */}
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-64 overflow-y-auto bg-slate-50/50">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1 text-slate-400" />
                  Đang tải tiêu chí...
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Gian hàng này chưa có tiêu chí checklist nào. Hãy thêm tiêu chí bên dưới!
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-white">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[11px] font-bold text-purple-700">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                        )}
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add new item form */}
            <form onSubmit={handleAdd} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
              <p className="text-xs font-bold text-slate-800">Thêm tiêu chí mới cho gian hàng này:</p>
              <div className="space-y-1.5">
                <Input
                  placeholder="Tên tiêu chí (VD: Chụp góc rộng kết cấu gian hàng)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Ghi chú hướng dẫn chụp..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="text-xs h-8"
                />

                <select
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs focus:border-blue-500 focus:outline-none"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
                >
                  <option value={ChecklistCategory.STRUCTURE}>Kết cấu (STRUCTURE)</option>
                  <option value={ChecklistCategory.BRANDING}>Logo (BRANDING)</option>
                  <option value={ChecklistCategory.POSM}>POSM & Standee</option>
                  <option value={ChecklistCategory.STAFFING}>Nhân sự (STAFFING)</option>
                  <option value={ChecklistCategory.CONDITION}>Điều kiện & Vệ sinh</option>
                  <option value={ChecklistCategory.OTHER}>Khác (OTHER)</option>
                </select>
              </div>

              <Button type="submit" size="sm" disabled={adding} className="w-full text-xs h-8 gap-1">
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Thêm tiêu chí
              </Button>
            </form>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
