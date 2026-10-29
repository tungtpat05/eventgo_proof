'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Briefcase, Building2, Mail, Phone, Calendar } from 'lucide-react';
import { Campaign } from '@/domain/entities';
import { WizardFooter } from './wizard-footer';
import { saveCampaignStep1Action } from '../../actions/campaign-wizard-actions';
import { useTranslations } from 'next-intl';

interface Step1InfoProps {
  campaign: Campaign;
  onNext: () => void;
  onAutoSaveNotify?: () => void;
}

export function Step1Info({ campaign, onNext, onAutoSaveNotify }: Step1InfoProps) {
  const router = useRouter();
  const t = useTranslations('campaigns.wizard.step1');

  const [formData, setFormData] = useState({
    title: campaign.title || '',
    companyName: campaign.companyName || '',
    brandName: campaign.brandName || '',
    companyTaxCode: campaign.companyTaxCode || '',
    companyContactName: campaign.companyContactName || '',
    companyContactEmail: campaign.companyContactEmail || '',
    companyContactPhone: campaign.companyContactPhone || '',
    companyAddress: campaign.companyAddress || '',
    startDate: campaign.startDate
      ? new Date(campaign.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: campaign.endDate
      ? new Date(campaign.endDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: campaign.description || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlurSave = async () => {
    if (!formData.title.trim()) return;

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));

    const res = await saveCampaignStep1Action(campaign.id, fd);
    if (res.success && onAutoSaveNotify) {
      onAutoSaveNotify();
    }
  };

  const handleNextClick = async () => {
    if (!formData.title.trim()) {
      setErrorMsg(t('errNameRequired'));
      return;
    }
    if (!formData.companyName.trim()) {
      setErrorMsg(t('errCompanyRequired'));
      return;
    }
    if (!formData.brandName.trim()) {
      setErrorMsg(t('errBrandRequired'));
      return;
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMsg(t('errDateRange'));
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));

    const res = await saveCampaignStep1Action(campaign.id, fd);
    setIsSaving(false);

    if (res.success) {
      onNext();
    } else {
      setErrorMsg(res.error || t('errGeneric'));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        {/* Card Header */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {t('title')}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {t('subtitle')}
                </CardDescription>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {t('stepBadge')}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* 1. Tên chiến dịch */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-slate-800">
              {t('nameLabel')} <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlurSave}
              placeholder={t('namePlaceholder')}
              className="h-10 text-sm border-slate-200 focus-visible:ring-blue-600 font-medium"
            />
          </div>

          {/* 2. Thông tin công ty / khách hàng */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600 shadow-2xs">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{t('companyAccordionTitle')}</h4>
                <p className="text-[11px] text-slate-500">{t('companyAccordionHint')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên công ty */}
              <div className="space-y-1.5">
                <label htmlFor="companyName" className="text-xs font-semibold text-slate-700">
                  {t('companyLabel')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  onBlur={handleBlurSave}
                  placeholder={t('companyPlaceholder')}
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>

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
                  onBlur={handleBlurSave}
                  placeholder={t('taxCodePlaceholder')}
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>

              {/* Người liên hệ */}
              <div className="space-y-1.5">
                <label htmlFor="companyContactName" className="text-xs font-semibold text-slate-700">
                  {t('contactNameLabel')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="companyContactName"
                  name="companyContactName"
                  value={formData.companyContactName}
                  onChange={handleChange}
                  onBlur={handleBlurSave}
                  placeholder={t('contactNamePlaceholder')}
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>

              {/* Email liên hệ */}
              <div className="space-y-1.5">
                <label htmlFor="companyContactEmail" className="text-xs font-semibold text-slate-700">
                  {t('contactEmailLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="companyContactEmail"
                    name="companyContactEmail"
                    type="email"
                    value={formData.companyContactEmail}
                    onChange={handleChange}
                    onBlur={handleBlurSave}
                    placeholder={t('contactEmailPlaceholder')}
                    className="h-9 pl-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
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
                    onBlur={handleBlurSave}
                    placeholder={t('contactPhonePlaceholder')}
                    className="h-9 pl-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              {/* Thương hiệu / Nhãn */}
              <div className="space-y-1.5">
                <label htmlFor="brandName" className="text-xs font-semibold text-slate-700">
                  {t('brandLabel')} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="brandName"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  onBlur={handleBlurSave}
                  placeholder={t('brandPlaceholder')}
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
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
                onBlur={handleBlurSave}
                placeholder={t('addressPlaceholder')}
                className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
              />
            </div>
          </div>

          {/* 3. Thời gian triển khai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>{t('startDateLabel')} <span className="text-red-500">*</span></span>
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                onBlur={handleBlurSave}
                className="h-10 text-xs border-slate-200 focus-visible:ring-blue-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>{t('endDateLabel')} <span className="text-red-500">*</span></span>
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                onBlur={handleBlurSave}
                className="h-10 text-xs border-slate-200 focus-visible:ring-blue-600 font-medium"
              />
            </div>
          </div>

          {/* 4. Mô tả / ghi chú chung */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>{t('descLabel')}</span>
              <span className="text-[11px] text-slate-500 font-normal">{t('descHint')}</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlurSave}
              placeholder={t('descPlaceholder')}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <WizardFooter
        currentStep={1}
        onNext={handleNextClick}
        isNextLoading={isSaving}
        onCancel={() => router.push('/campaigns/managed')}
      />
    </div>
  );
}
