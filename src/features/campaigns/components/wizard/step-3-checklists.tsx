'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckSquare,
  Copy,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { Campaign, Location, Booth, ChecklistItem } from '@/domain/entities';
import { ChecklistTemplatePreset } from '@/domain/constants/checklist-templates';
import { ChecklistCategory } from '@/domain/enums';
import { WizardFooter } from './wizard-footer';
import {
  addChecklistItemInWizardAction,
  deleteChecklistItemInWizardAction,
  batchApplyChecklistInWizardAction,
} from '../../actions/campaign-wizard-actions';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Step3ChecklistsProps {
  campaign: Campaign;
  locations: (Location & {
    booths: (Booth & { checklistItems: ChecklistItem[] })[];
  })[];
  allBooths: {
    id: string;
    name: string;
    locationId: string;
    locationName: string;
    checklistCount: number;
  }[];
  templates: ChecklistTemplatePreset[];
  onBack: () => void;
  onNext: () => void;
  onAutoSaveNotify?: () => void;
}

export function Step3Checklists({
  campaign,
  locations,
  allBooths,
  templates,
  onBack,
  onNext,
  onAutoSaveNotify,
}: Step3ChecklistsProps) {
  const router = useRouter();

  // Active booth selector
  const [activeBoothId, setActiveBoothId] = useState<string>(() => {
    return allBooths[0]?.id || '';
  });

  // Batch scope options: 'LOCATION' | 'ALL_CAMPAIGN' | 'CUSTOM'
  const [batchScope, setBatchScope] = useState<'LOCATION' | 'ALL_CAMPAIGN' | 'CUSTOM'>('LOCATION');
  const [selectedCustomBoothIds, setSelectedCustomBoothIds] = useState<string[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistCategory>(ChecklistCategory.OTHER);
  const [newIsRequired, setNewIsRequired] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Find active booth and its items
  const activeBoothData = useMemo(() => {
    for (const loc of locations) {
      const b = loc.booths.find((item) => item.id === activeBoothId);
      if (b) return { booth: b, location: loc };
    }
    return null;
  }, [locations, activeBoothId]);

  const activeItems = activeBoothData?.booth.checklistItems || [];
  const requiredCount = activeItems.filter((it) => it.isRequired).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Dùng mẫu Checklist
  const handleSelectTemplate = async (templateCode: string) => {
    if (!templateCode || !activeBoothId) return;

    setIsLoading(true);
    const res = await batchApplyChecklistInWizardAction(campaign.id, {
      templateCode,
      targetBoothIds: [activeBoothId],
      mode: 'REPLACE',
    });
    setIsLoading(false);

    if (res.success) {
      showToast('Đã áp dụng mẫu checklist vào booth.');
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Lỗi khi áp dụng mẫu');
    }
  };

  // 2. Thêm tiêu chí mới
  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBoothId || !newTitle.trim()) return;

    setIsLoading(true);
    const fd = new FormData();
    fd.append('title', newTitle.trim());
    fd.append('description', newDesc.trim());
    fd.append('category', newCategory);
    fd.append('isRequired', String(newIsRequired));

    const res = await addChecklistItemInWizardAction(campaign.id, activeBoothId, fd);
    setIsLoading(false);

    if (res.success) {
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
      showToast('Đã thêm tiêu chí kiểm tra mới.');
    } else {
      alert(res.error || 'Lỗi khi thêm tiêu chí');
    }
  };

  // 3. Xóa tiêu chí
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tiêu chí này khỏi booth?')) return;

    setIsLoading(true);
    const res = await deleteChecklistItemInWizardAction(campaign.id, itemId);
    setIsLoading(false);

    if (res.success) {
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Xóa thất bại');
    }
  };

  // 4. Áp dụng checklist hàng loạt theo 3 lựa chọn
  const handleApplyBatchScope = async () => {
    if (!activeBoothId || activeItems.length === 0) {
      alert('Vui lòng thiết lập ít nhất 1 tiêu chí cho booth hiện tại trước khi nhân bản.');
      return;
    }

    let targetIds: string[] = [];

    if (batchScope === 'LOCATION') {
      if (!activeBoothData) return;
      // All booths in current location except self (or including self)
      targetIds = activeBoothData.location.booths.map((b) => b.id);
    } else if (batchScope === 'ALL_CAMPAIGN') {
      targetIds = allBooths.map((b) => b.id);
    } else if (batchScope === 'CUSTOM') {
      targetIds = selectedCustomBoothIds;
      if (targetIds.length === 0) {
        alert('Vui lòng chọn ít nhất một booth trong danh sách tùy chọn.');
        return;
      }
    }

    setIsLoading(true);
    const res = await batchApplyChecklistInWizardAction(campaign.id, {
      sourceBoothId: activeBoothId,
      targetBoothIds: targetIds,
      mode: 'REPLACE',
    });
    setIsLoading(false);

    if (res.success) {
      showToast(`Đã đồng bộ checklist thành công cho ${targetIds.length} booth.`);
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Đồng bộ thất bại');
    }
  };

  const handleNextCheck = () => {
    // Check if any booth has 0 checklist items
    const emptyBooths = allBooths.filter((b) => b.checklistCount === 0);
    if (emptyBooths.length > 0) {
      const confirmProceed = confirm(
        `Hiện có ${emptyBooths.length} booth chưa có tiêu chí checklist nào. Bạn có muốn tiếp tục sang bước Phân công nhân sự không?`
      );
      if (!confirmProceed) return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {/* Main Checklist Config Card */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        {/* Card Header */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                  Cấu hình checklist
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Thiết lập các tiêu chí cần kiểm tra tại từng booth.
                </CardDescription>
              </div>
            </div>

            {/* Quick Action: Sao chép */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyBatchScope}
              isLoading={isLoading}
              className="text-xs h-8 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              Sao chép sang booth khác
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* 1. THANH CHỌN NGỮ CẢNH: ÁP DỤNG CHO & MẪU CHECKLIST */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            {/* Áp dụng cho */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Áp dụng cho</label>
              <select
                value={activeBoothId}
                onChange={(e) => setActiveBoothId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {allBooths.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.locationName} / {b.name} ({b.checklistCount} tiêu chí)
                  </option>
                ))}
              </select>
            </div>

            {/* Dùng mẫu checklist */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Dùng mẫu checklist</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleSelectTemplate(e.target.value);
                }}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="" disabled>
                  -- Chọn mẫu tiêu chí có sẵn --
                </option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.code}>
                    {tpl.name} ({tpl.items.length} tiêu chí)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. KHU VỰC TIÊU CHÍ KIỂM TRA (LIST ITEMS) */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Tiêu chí kiểm tra
                </h4>
                <p className="text-[11px] text-slate-500">
                  {activeItems.length} tiêu chí • {requiredCount} bắt buộc
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm tiêu chí
              </Button>
            </div>

            {/* Criteria List */}
            {activeItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/40">
                <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Booth này chưa có tiêu chí nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chọn mẫu checklist ở trên hoặc bấm "+ Thêm tiêu chí" để bắt đầu.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeItems.map((item, index) => {
                  const numStr = String(index + 1).padStart(2, '0');

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <GripVertical className="h-4 w-4 text-slate-300 cursor-grab shrink-0" />
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                          {numStr}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-800 truncate block">
                            {item.title}
                          </span>
                          {item.description && (
                            <span className="text-[11px] text-slate-400 truncate block">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {/* Required / Optional Badge */}
                        {item.isRequired ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Bắt buộc
                          </span>
                        ) : (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600">
                            Tùy chọn
                          </span>
                        )}

                        {/* Delete action */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. KHỐI ÁP DỤNG CHECKLIST HÀNG LOẠT (3 RADIO CARDS) */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Áp dụng checklist</h4>
              <p className="text-[11px] text-slate-500">
                Chọn phạm vi áp dụng cấu hình checklist này.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Tất cả booth tại địa điểm này */}
              <div
                onClick={() => setBatchScope('LOCATION')}
                className={cn(
                  'rounded-xl border p-3.5 cursor-pointer transition-all bg-white select-none',
                  batchScope === 'LOCATION'
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center',
                      batchScope === 'LOCATION'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {batchScope === 'LOCATION' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Tất cả booth tại địa điểm này
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  {activeBoothData?.location.booths.length || 0} booth tại{' '}
                  {activeBoothData?.location.name || 'địa điểm hiện tại'}
                </p>
              </div>

              {/* Option 2: Tất cả booth trong chiến dịch */}
              <div
                onClick={() => setBatchScope('ALL_CAMPAIGN')}
                className={cn(
                  'rounded-xl border p-3.5 cursor-pointer transition-all bg-white select-none',
                  batchScope === 'ALL_CAMPAIGN'
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center',
                      batchScope === 'ALL_CAMPAIGN'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {batchScope === 'ALL_CAMPAIGN' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Tất cả booth trong chiến dịch
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  {allBooths.length} booth tại {locations.length} địa điểm
                </p>
              </div>

              {/* Option 3: Chọn booth cụ thể */}
              <div
                onClick={() => setBatchScope('CUSTOM')}
                className={cn(
                  'rounded-xl border p-3.5 cursor-pointer transition-all bg-white select-none',
                  batchScope === 'CUSTOM'
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center',
                      batchScope === 'CUSTOM'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {batchScope === 'CUSTOM' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">Chọn booth cụ thể</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  Tự chọn một hoặc nhiều booth
                </p>
              </div>
            </div>

            {/* Custom Booth selection checkboxes if CUSTOM selected */}
            {batchScope === 'CUSTOM' && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Chọn các booth áp dụng tiêu chí:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                  {allBooths.map((b) => {
                    const isChecked = selectedCustomBoothIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors',
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-700'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCustomBoothIds((prev) => [...prev, b.id]);
                            } else {
                              setSelectedCustomBoothIds((prev) =>
                                prev.filter((id) => id !== b.id)
                              );
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                onClick={handleApplyBatchScope}
                isLoading={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-4"
              >
                Áp dụng cấu hình này
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: THÊM TIÊU CHÍ */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">Thêm tiêu chí kiểm tra</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleAddCriterion} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Tiêu đề kiểm tra <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Logo đúng vị trí quy định"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Hướng dẫn / Yêu cầu</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Chụp ảnh góc nhìn chính diện, ánh sáng rõ nét..."
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800">Phân loại</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value={ChecklistCategory.BRANDING}>Thương hiệu (Branding)</option>
                    <option value={ChecklistCategory.POSM}>Vật phẩm (POSM)</option>
                    <option value={ChecklistCategory.STRUCTURE}>Kết cấu (Structure)</option>
                    <option value={ChecklistCategory.STAFFING}>Nhân sự (Staffing)</option>
                    <option value={ChecklistCategory.CONDITION}>Hiện trạng (Condition)</option>
                    <option value={ChecklistCategory.OTHER}>Khác (Other)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800">Mức độ</label>
                  <select
                    value={newIsRequired ? 'true' : 'false'}
                    onChange={(e) => setNewIsRequired(e.target.value === 'true')}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="true">Bắt buộc (Required)</option>
                    <option value="false">Tùy chọn (Optional)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" isLoading={isLoading} className="bg-blue-600 text-white">
                  Thêm tiêu chí
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <WizardFooter currentStep={3} onBack={onBack} onNext={handleNextCheck} />
    </div>
  );
}
