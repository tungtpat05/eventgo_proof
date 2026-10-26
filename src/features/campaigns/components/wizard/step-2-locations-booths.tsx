'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Building2,
  Store,
  Plus,
  Copy,
  Trash2,
  MapPin,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Campaign, Location, Booth, ChecklistItem } from '@/domain/entities';
import { WizardFooter } from './wizard-footer';
import {
  addLocationInWizardAction,
  deleteLocationInWizardAction,
  createBoothInWizardAction,
  updateBoothInWizardAction,
  deleteBoothInWizardAction,
  duplicateBoothInWizardAction,
} from '../../actions/campaign-wizard-actions';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Step2LocationsBoothsProps {
  campaign: Campaign;
  locations: (Location & {
    booths: (Booth & { checklistItems?: ChecklistItem[] })[];
  })[];
  onBack: () => void;
  onNext: () => void;
  onAutoSaveNotify?: () => void;
}

export function Step2LocationsBooths({
  campaign,
  locations,
  onBack,
  onNext,
  onAutoSaveNotify,
}: Step2LocationsBoothsProps) {
  const router = useRouter();
  const t = useTranslations('campaigns.wizard.step2');
  const tActions = useTranslations('common.actions');

  // Find first booth to select by default, or null
  const firstBooth = locations[0]?.booths[0] || null;
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(firstBooth?.id || null);

  // Expanded location accordions
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    locations.forEach((l) => (map[l.id] = true));
    return map;
  });

  // Modal states
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationCity, setNewLocationCity] = useState('Hà Nội');

  const [addBoothForLocationId, setAddBoothForLocationId] = useState<string | null>(null);
  const [newBoothName, setNewBoothName] = useState('');
  const [newBoothCode, setNewBoothCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Total booth & location counts
  const totalBooths = locations.reduce((acc, l) => acc + l.booths.length, 0);

  // Find the selected booth and its parent location
  let selectedBooth: (Booth & { checklistItems?: ChecklistItem[] }) | null = null;
  let selectedBoothLocation: Location | null = null;

  for (const loc of locations) {
    const found = loc.booths.find((b) => b.id === selectedBoothId);
    if (found) {
      selectedBooth = found;
      selectedBoothLocation = loc;
      break;
    }
  }

  // Selected booth local edit state
  const [boothFormData, setBoothFormData] = useState({
    name: selectedBooth?.name || '',
    code: selectedBooth?.code || '',
    description: selectedBooth?.description || '',
  });

  // When selected booth changes, sync form data
  React.useEffect(() => {
    if (selectedBooth) {
      setBoothFormData({
        name: selectedBooth.name || '',
        code: selectedBooth.code || '',
        description: selectedBooth.description || '',
      });
    }
  }, [selectedBoothId]);

  const toggleLocationExpand = (locId: string) => {
    setExpandedLocations((prev) => ({ ...prev, [locId]: !prev[locId] }));
  };

  // Add location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const fd = new FormData();
    fd.append('name', newLocationName.trim());
    fd.append('address', newLocationAddress.trim() || 'Chưa cập nhật địa chỉ');
    fd.append('city', newLocationCity.trim());

    const res = await addLocationInWizardAction(campaign.id, fd);
    setIsLoading(false);

    if (res.success && res.data) {
      setShowAddLocationModal(false);
      setNewLocationName('');
      setNewLocationAddress('');
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      setErrorMessage(res.error || t('errLocationNameRequired'));
    }
  };

  // Delete location
  const handleDeleteLocation = async (locId: string, locName: string) => {
    if (!confirm(t('confirmDeleteLocation'))) return;

    setIsLoading(true);
    const res = await deleteLocationInWizardAction(campaign.id, locId);
    setIsLoading(false);

    if (res.success) {
      router.refresh();
      if (selectedBoothLocation?.id === locId) {
        setSelectedBoothId(null);
      }
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || t('deleteFailed'));
    }
  };

  // Add booth
  const handleAddBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBoothForLocationId || !newBoothName.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const fd = new FormData();
    fd.append('name', newBoothName.trim());
    fd.append('code', newBoothCode.trim());

    const res = await createBoothInWizardAction(campaign.id, addBoothForLocationId, fd);
    setIsLoading(false);

    if (res.success && res.data) {
      const createdId = res.data.id;
      setAddBoothForLocationId(null);
      setNewBoothName('');
      setNewBoothCode('');
      setSelectedBoothId(createdId);
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      setErrorMessage(res.error || t('errBoothNameRequired'));
    }
  };

  // Update booth form change & auto-blur save
  const handleBoothFormBlur = async () => {
    if (!selectedBoothId || !boothFormData.name.trim()) return;

    const fd = new FormData();
    fd.append('name', boothFormData.name.trim());
    fd.append('code', boothFormData.code.trim());
    fd.append('description', boothFormData.description.trim());

    const res = await updateBoothInWizardAction(campaign.id, selectedBoothId, fd);
    if (res.success && onAutoSaveNotify) {
      onAutoSaveNotify();
    }
  };

  // Duplicate booth
  const handleDuplicateBooth = async () => {
    if (!selectedBooth) return;

    setIsLoading(true);
    const res = await duplicateBoothInWizardAction(
      campaign.id,
      selectedBooth.id,
      selectedBooth.locationId,
      `${selectedBooth.name} ${t('duplicateSuffix')}`,
      selectedBooth.code ? `${selectedBooth.code}-COPY` : null
    );
    setIsLoading(false);

    if (res.success && res.data) {
      setSelectedBoothId(res.data.id);
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || t('duplicateFailed'));
    }
  };

  // Delete booth
  const handleDeleteBooth = async () => {
    if (!selectedBooth) return;
    if (!confirm(t('confirmDeleteBooth'))) return;

    setIsLoading(true);
    const res = await deleteBoothInWizardAction(campaign.id, selectedBooth.id);
    setIsLoading(false);

    if (res.success) {
      setSelectedBoothId(null);
      router.refresh();
      if (onAutoSaveNotify) onAutoSaveNotify();
    } else {
      alert(res.error || t('deleteFailed'));
    }
  };

  const handleNextCheck = () => {
    if (locations.length === 0) {
      alert(t('errNeedLocation'));
      return;
    }
    if (totalBooths === 0) {
      alert(t('errNeedBooth'));
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CỘT TRÁI: MASTER TREE VIEW */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {t('structureTitle')}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('locationCount', { count: locations.length })} • {t('boothCount', { count: totalBooths })}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 space-y-2 max-h-[580px] overflow-y-auto">
              {/* Campaign Root Node */}
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-100/70 text-slate-800 text-xs font-bold">
                <Briefcase className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="truncate">{campaign.title}</span>
              </div>

              {/* Locations Tree */}
              {locations.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg">
                  <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">{t('emptyLocations')}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t('emptyLocationHint')}
                  </p>
                </div>
              ) : (
                locations.map((loc) => {
                  const isExpanded = expandedLocations[loc.id] !== false;

                  return (
                    <div
                      key={loc.id}
                      className="rounded-lg border border-slate-200/80 bg-white overflow-hidden"
                    >
                      {/* Location Header Node */}
                      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50/70 hover:bg-slate-100/60 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleLocationExpand(loc.id)}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          )}
                          <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {loc.name}
                          </span>
                          <span className="shrink-0 rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                            {loc.booths.length}
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            title={t('addBoothTooltip')}
                            onClick={() => {
                              setAddBoothForLocationId(loc.id);
                              setNewBoothName(`Booth ${loc.booths.length + 1}`);
                              setNewBoothCode(`B0${loc.booths.length + 1}`);
                            }}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={t('deleteLocationTooltip')}
                            onClick={() => handleDeleteLocation(loc.id, loc.name)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Child Booths */}
                      {isExpanded && (
                        <div className="p-1.5 pl-6 space-y-1">
                          {loc.booths.length === 0 ? (
                            <div className="py-2 px-2 text-[11px] text-slate-400 italic">
                              {t('noBoothsInLocation')}
                            </div>
                          ) : (
                            loc.booths.map((b) => {
                              const isSelected = b.id === selectedBoothId;

                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setSelectedBoothId(b.id)}
                                  className={cn(
                                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all text-left cursor-pointer',
                                    isSelected
                                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 shadow-2xs'
                                      : 'text-slate-700 hover:bg-slate-50'
                                  )}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Store
                                      className={cn(
                                        'h-3.5 w-3.5 shrink-0',
                                        isSelected ? 'text-blue-600' : 'text-slate-400'
                                      )}
                                    />
                                    <span className="truncate">{b.name}</span>
                                  </div>

                                  {b.code && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {b.code}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Button "+ Thêm địa điểm" */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddLocationModal(true)}
                className="w-full mt-2 h-9 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-dashed border-blue-300 gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                {t('addLocation')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI: DETAIL EDITOR */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7">
          {selectedBooth ? (
            <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
              {/* Header Booth Detail */}
              <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        BOOTH
                      </span>
                      <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                        {selectedBooth.name}
                      </CardTitle>
                    </div>
                  </div>

                  {/* Actions: Nhân bản & Xóa */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDuplicateBooth}
                      isLoading={isLoading}
                      className="text-xs h-8 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      {t('btnDuplicateBooth')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteBooth}
                      isLoading={isLoading}
                      className="text-xs h-8 gap-1.5 border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('btnDeleteBooth')}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Form Chi Tiết Booth */}
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tên booth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800">
                      {t('boothNameLabel')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={boothFormData.name}
                      onChange={(e) =>
                        setBoothFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      onBlur={handleBoothFormBlur}
                      placeholder={t('boothNamePlaceholder')}
                      className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>

                  {/* Mã booth */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800">
                      {t('boothCodeLabel')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={boothFormData.code}
                      onChange={(e) =>
                        setBoothFormData((prev) => ({ ...prev, code: e.target.value }))
                      }
                      onBlur={handleBoothFormBlur}
                      placeholder={t('boothCodePlaceholder')}
                      className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Mô tả / ghi chú */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800">{t('boothDescLabel')}</label>
                  <textarea
                    rows={4}
                    value={boothFormData.description}
                    onChange={(e) =>
                      setBoothFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    onBlur={handleBoothFormBlur}
                    placeholder={t('boothDescPlaceholder')}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                </div>

                {/* Thuộc địa điểm info box */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {t('belongsToLocation')}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedBoothLocation?.name || t('unknownLocation')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <Store className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">{t('noBoothSelected')}</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {t('noBoothSelectedHint')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: THÊM ĐỊA ĐIỂM */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">{t('addLocationModalTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowAddLocationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                {tActions('close')}
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  {t('locationName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder={t('newLocationPlaceholder')}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">{t('address')}</label>
                <Input
                  value={newLocationAddress}
                  onChange={(e) => setNewLocationAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">{t('city')}</label>
                <Input
                  value={newLocationCity}
                  onChange={(e) => setNewLocationCity(e.target.value)}
                  placeholder="Hà Nội"
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddLocationModal(false)}
                  className="cursor-pointer"
                >
                  {t('btnCancelLocation')}
                </Button>
                <Button type="submit" size="sm" isLoading={isLoading} className="bg-blue-600 text-white cursor-pointer">
                  {t('btnCreateLocation')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM BOOTH VÀO ĐỊA ĐIỂM */}
      {addBoothForLocationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">{t('addBoothModalTitle')}</h3>
              <button
                type="button"
                onClick={() => setAddBoothForLocationId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                {tActions('close')}
              </button>
            </div>

            <form onSubmit={handleAddBooth} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  {t('boothNameLabel')} <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={newBoothName}
                  onChange={(e) => setNewBoothName(e.target.value)}
                  placeholder={t('boothNamePlaceholder')}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">{t('boothCodeLabel')}</label>
                <Input
                  value={newBoothCode}
                  onChange={(e) => setNewBoothCode(e.target.value)}
                  placeholder={t('boothCodePlaceholder')}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddBoothForLocationId(null)}
                  className="cursor-pointer"
                >
                  {tActions('cancel')}
                </Button>
                <Button type="submit" size="sm" isLoading={isLoading} className="bg-blue-600 text-white cursor-pointer">
                  {t('createBooth')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <WizardFooter currentStep={2} onBack={onBack} onNext={handleNextCheck} />
    </div>
  );
}
