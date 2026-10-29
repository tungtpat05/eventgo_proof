'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Briefcase,
  Building2,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardHeader } from './wizard-header';
import { WizardStepper } from './wizard-stepper';
import { WizardFooter } from './wizard-footer';
import { createDraftCampaignAction } from '../../actions/campaign-wizard-actions';
import { useTranslations } from 'next-intl';

export function NewCampaignStep1() {
  const router = useRouter();
  const t = useTranslations('campaigns.wizard.step1');
  const tWizard = useTranslations('campaigns.wizard');

  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    brandName: '',
    companyTaxCode: '',
    companyContactName: '',
    companyContactEmail: '',
    companyContactPhone: '',
    companyAddress: '',
    startDate: today,
    endDate: nextMonth,
    description: '',
  });

  // Progressive Disclosure: Optional Invoicing & Legal details accordion
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);

  // Dialog Confirm Cancel state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextClick = async () => {
    if (!formData.title.trim()) {
      setErrorMessage(t('errNameRequired'));
      return;
    }
    if (!formData.brandName.trim()) {
      setErrorMessage(t('errBrandRequired'));
      return;
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMessage(t('errDateRange'));
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    // Fallback company name if left empty in progressive disclosure
    const submissionData = {
      ...formData,
      companyName: formData.companyName.trim() || formData.brandName.trim(),
    };

    const fd = new FormData();
    Object.entries(submissionData).forEach(([k, v]) => fd.append(k, v));

    const res = await createDraftCampaignAction(fd);
    setIsSaving(false);

    if (res.success && res.data) {
      router.push(`/campaigns/${res.data.id}/wizard?step=2`);
    } else {
      setErrorMessage(res.error || t('errGeneric'));
    }
  };

  const handleCancel = () => {
    if (formData.title.trim() || formData.brandName.trim()) {
      setIsCancelDialogOpen(true);
    } else {
      router.push('/campaigns/managed');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header with Breadcrumb & Auto-save status */}
      <WizardHeader campaignTitle={tWizard('title')} isSaved={true} />

      {/* 2. Stepper */}
      <WizardStepper currentStep={1} maxAccessibleStep={1} />

      {/* 3. Step 1 Form Card */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden rounded-2xl">
        {/* Card Header */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  {t('title')}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {t('subtitle')}
                </CardDescription>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {t('stepBadge')}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Fields (Essential) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Tên chiến dịch */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="title" className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>{t('nameLabel')} <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-slate-500 font-normal">{t('nameHint')}</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('namePlaceholder')}
                className="h-11 text-sm border-slate-200 focus-visible:ring-blue-600 font-medium rounded-xl"
              />
            </div>

            {/* 2. Thương hiệu / Nhãn hàng */}
            <div className="space-y-1.5">
              <label htmlFor="brandName" className="text-xs font-semibold text-slate-800">
                {t('brandLabel')} <span className="text-rose-500">*</span>
              </label>
              <Input
                id="brandName"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                placeholder={t('brandPlaceholder')}
                className="h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-600 rounded-xl"
              />
            </div>

            {/* 3. Tên công ty / Khách hàng (Tùy chọn) */}
            <div className="space-y-1.5">
              <label htmlFor="companyName" className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>{t('companyLabel')}</span>
                <span className="text-[11px] text-slate-500 font-normal">{t('companyHint')}</span>
              </label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder={t('companyPlaceholder')}
                className="h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-600 rounded-xl"
              />
            </div>
          </div>

          {/* 4. Thời gian triển khai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>{t('startDateLabel')} <span className="text-rose-500">*</span></span>
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-600 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>{t('endDateLabel')} <span className="text-rose-500">*</span></span>
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                className="h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-600 rounded-xl font-medium"
              />
            </div>
          </div>

          {/* 5. Mô tả ngắn */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="description" className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>{t('descLabel')}</span>
              <span className="text-[11px] text-slate-500 font-normal">{t('descHint')}</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder={t('descPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors"
            />
          </div>

          {/* Progressive Disclosure Section: Thông tin pháp nhân & xuất hóa đơn */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowCompanyDetails((prev) => !prev)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {t('companyAccordionTitle')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {t('companyAccordionHint')}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  showCompanyDetails ? 'rotate-180' : ''
                )}
              />
            </button>

            {showCompanyDetails && (
              <div className="mt-3 p-4 rounded-xl border border-slate-200/80 bg-white space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mã số thuế */}
                  <div className="space-y-1.5">
                    <label htmlFor="companyTaxCode" className="text-xs font-semibold text-slate-700">
                      {t('taxCodeLabel')}
                    </label>
                    <Input
                      id="companyTaxCode"
                      name="companyTaxCode"
                      value={formData.companyTaxCode}
                      onChange={handleChange}
                      placeholder={t('taxCodePlaceholder')}
                      className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white rounded-lg"
                    />
                  </div>

                  {/* Người liên hệ */}
                  <div className="space-y-1.5">
                    <label htmlFor="companyContactName" className="text-xs font-semibold text-slate-700">
                      {t('contactNameLabel')}
                    </label>
                    <Input
                      id="companyContactName"
                      name="companyContactName"
                      value={formData.companyContactName}
                      onChange={handleChange}
                      placeholder={t('contactNamePlaceholder')}
                      className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white rounded-lg"
                    />
                  </div>

                  {/* Email liên hệ */}
                  <div className="space-y-1.5">
                    <label htmlFor="companyContactEmail" className="text-xs font-semibold text-slate-700">
                      {t('contactEmailLabel')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="companyContactEmail"
                        name="companyContactEmail"
                        type="email"
                        value={formData.companyContactEmail}
                        onChange={handleChange}
                        placeholder={t('contactEmailPlaceholder')}
                        className="h-9 pl-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label htmlFor="companyContactPhone" className="text-xs font-semibold text-slate-700">
                      {t('contactPhoneLabel')}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        id="companyContactPhone"
                        name="companyContactPhone"
                        value={formData.companyContactPhone}
                        onChange={handleChange}
                        placeholder={t('contactPhonePlaceholder')}
                        className="h-9 pl-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Địa chỉ công ty */}
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="companyAddress" className="text-xs font-semibold text-slate-700">
                    {t('addressLabel')}
                  </label>
                  <Input
                    id="companyAddress"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    placeholder={t('addressPlaceholder')}
                    className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <WizardFooter
        currentStep={1}
        onNext={handleNextClick}
        isNextLoading={isSaving}
        onCancel={handleCancel}
      />

      {/* Confirm Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {t('cancelTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600 pt-1 leading-relaxed">
              {t('cancelDesc')}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex sm:justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelDialogOpen(false)}
              className="text-xs cursor-pointer font-medium"
            >
              {t('cancelContinue')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push('/campaigns/managed')}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer font-semibold"
            >
              {t('cancelExit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
