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
  GripVertical,
  CheckCircle2,
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
import { useTranslations } from 'next-intl';
import { getLocalizedTemplatePreset } from '@/lib/i18n/checklist-preset-presenter';
import { getChecklistCategoryLabel } from '@/lib/i18n/enum-presenters';

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
  const t = useTranslations('campaigns.wizard.step3');
  const tRoot = useTranslations();

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

  // Localize pre-defined system checklist presets
  const localizedTemplates = useMemo(() => {
    return templates.map((tpl) =>
      getLocalizedTemplatePreset(tpl, (key: string) => {
        try {
          return tRoot(`campaigns.wizard.${key}` as any);
        } catch {
          return '';
        }
      })
    );
  }, [templates, tRoot]);

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
      showToast(t('toastAppliedSuccess'));
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || t('toastAppliedSuccess'));
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
      showToast(t('toastItemAdded'));
    } else {
      alert(res.error || 'Failed');
    }
  };

  // 3. Xóa tiêu chí
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t('confirmDeleteItem'))) return;

    setIsLoading(true);
    const res = await deleteChecklistItemInWizardAction(campaign.id, itemId);
    setIsLoading(false);

    if (res.success) {
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Failed');
    }
  };

  // 4. Áp dụng checklist hàng loạt theo 3 lựa chọn
  const handleApplyBatchScope = async () => {
    if (!activeBoothId || activeItems.length === 0) {
      alert(t('alertNeedItemsToCopy'));
      return;
    }

    let targetIds: string[] = [];

    if (batchScope === 'LOCATION') {
      if (!activeBoothData) return;
      targetIds = activeBoothData.location.booths.map((b) => b.id);
    } else if (batchScope === 'ALL_CAMPAIGN') {
      targetIds = allBooths.map((b) => b.id);
    } else if (batchScope === 'CUSTOM') {
      targetIds = selectedCustomBoothIds;
      if (targetIds.length === 0) {
        alert(t('alertSelectCustomBooths'));
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
      showToast(t('toastSyncSuccess', { count: targetIds.length }));
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || 'Failed');
    }
  };

  const handleNextCheck = () => {
    const emptyBooths = allBooths.filter((b) => b.checklistCount === 0);
    if (emptyBooths.length > 0) {
      const confirmProceed = confirm(t('confirmProceedWithoutChecklist', { count: emptyBooths.length }));
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
                  {t('headerTitle')}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {t('headerDesc')}
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
              {t('copyToOtherBooths')}
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
              <label className="text-xs font-semibold text-slate-700">{t('applyFor')}</label>
              <select
                value={activeBoothId}
                onChange={(e) => setActiveBoothId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {allBooths.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.locationName} / {b.name} ({t('criteriaCount', { count: b.checklistCount })})
                  </option>
                ))}
              </select>
            </div>

            {/* Dùng mẫu checklist */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t('useTemplate')}</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleSelectTemplate(e.target.value);
                }}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="" disabled>
                  {t('selectTemplatePlaceholder')}
                </option>
                {localizedTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.code}>
                    {tpl.name} ({t('criteriaCount', { count: tpl.items.length })})
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
                  {t('criteriaSectionTitle')}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {t('criteriaSubtitle', { count: activeItems.length, required: requiredCount })}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('addCriterion')}
              </Button>
            </div>

            {/* Criteria List */}
            {activeItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/40">
                <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">{t('emptyBoothTitle')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t('emptyBoothDesc')}
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
                            {t('badgeRequired')}
                          </span>
                        ) : (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600">
                            {t('badgeOptional')}
                          </span>
                        )}

                        {/* Delete action */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title={t('deleteItemTooltip')}
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
              <h4 className="text-xs font-bold text-slate-900">{t('batchScopeTitle')}</h4>
              <p className="text-[11px] text-slate-500">
                {t('batchScopeSubtitle')}
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
                    {t('batchLocationTitle')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  {t('batchLocationDesc', {
                    count: activeBoothData?.location.booths.length || 0,
                    location: activeBoothData?.location.name || t('currentLocationFallback'),
                  })}
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
                    {t('batchCampaignTitle')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  {t('batchCampaignDesc', {
                    boothCount: allBooths.length,
                    locCount: locations.length,
                  })}
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
                  <span className="text-xs font-bold text-slate-900">{t('batchCustomTitle')}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  {t('batchCustomDesc')}
                </p>
              </div>
            </div>

            {/* Custom Booth selection checkboxes if CUSTOM selected */}
            {batchScope === 'CUSTOM' && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  {t('customSelectPrompt')}
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
                {t('applyBatchBtn')}
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
              <h3 className="text-sm font-bold text-slate-900">{t('modalTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                {t('closeModal')}
              </button>
            </div>

            <form onSubmit={handleAddCriterion} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  {t('fieldTitle')} <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t('placeholderTitle')}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">{t('fieldDesc')}</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={t('placeholderDesc')}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800">{t('fieldCategory')}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    {Object.values(ChecklistCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {getChecklistCategoryLabel(cat, (k) => tRoot(k as any))}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800">{t('fieldLevel')}</label>
                  <select
                    value={newIsRequired ? 'true' : 'false'}
                    onChange={(e) => setNewIsRequired(e.target.value === 'true')}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="true">{t('badgeRequired')}</option>
                    <option value="false">{t('badgeOptional')}</option>
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
                  {t('btnCancel')}
                </Button>
                <Button type="submit" size="sm" isLoading={isLoading} className="bg-blue-600 text-white">
                  {t('btnSubmitAdd')}
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
