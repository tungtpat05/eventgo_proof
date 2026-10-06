'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Briefcase, Building2, Mail, Phone } from 'lucide-react';
import { WizardHeader } from './wizard-header';
import { WizardStepper } from './wizard-stepper';
import { WizardFooter } from './wizard-footer';
import { createDraftCampaignAction } from '../../actions/campaign-wizard-actions';

export function NewCampaignStep1() {
  const router = useRouter();

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

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextClick = async () => {
    if (!formData.title.trim()) {
      setErrorMessage('Vui lòng nhập tên chiến dịch.');
      return;
    }
    if (!formData.companyName.trim()) {
      setErrorMessage('Vui lòng nhập tên công ty.');
      return;
    }
    if (!formData.brandName.trim()) {
      setErrorMessage('Vui lòng nhập thương hiệu / nhãn hàng.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));

    const res = await createDraftCampaignAction(fd);
    setIsSaving(false);

    if (res.success && res.data) {
      router.push(`/campaigns/${res.data.id}/wizard?step=2`);
    } else {
      setErrorMessage(res.error || 'Lỗi khi khởi tạo chiến dịch.');
    }
  };

  const handleCancel = () => {
    if (formData.title.trim()) {
      if (confirm('Bạn có chắc chắn muốn hủy? Các thông tin bạn vừa nhập sẽ không được lưu.')) {
        router.push('/campaigns');
      }
    } else {
      router.push('/campaigns');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header with Breadcrumb & Auto-save status */}
      <WizardHeader campaignTitle="Tạo chiến dịch mới" isSaved={true} />

      {/* 2. Stepper */}
      <WizardStepper currentStep={1} maxAccessibleStep={1} />

      {/* 3. Step 1 Form Card */}
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
                  Thông tin chiến dịch
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Thiết lập thông tin cơ bản để đội ngũ nhận diện chiến dịch.
                </CardDescription>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Bản nháp
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {errorMessage}
            </div>
          )}

          {/* 1. Tên chiến dịch */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-slate-800">
              Tên chiến dịch <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Samsung Galaxy Roadshow 2026"
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
                <h4 className="text-xs font-bold text-slate-900">Thông tin công ty / khách hàng</h4>
                <p className="text-[11px] text-slate-500">Thông tin đầu mối phụ trách chiến dịch</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên công ty */}
              <div className="space-y-1.5">
                <label htmlFor="companyName" className="text-xs font-semibold text-slate-700">
                  Tên công ty <span className="text-red-500">*</span>
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="VD: Samsung Vietnam"
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>

              {/* Mã số thuế */}
              <div className="space-y-1.5">
                <label htmlFor="companyTaxCode" className="text-xs font-semibold text-slate-700">
                  Mã số thuế
                </label>
                <Input
                  id="companyTaxCode"
                  name="companyTaxCode"
                  value={formData.companyTaxCode}
                  onChange={handleChange}
                  placeholder="VD: 0303217354"
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>

              {/* Người liên hệ */}
              <div className="space-y-1.5">
                <label htmlFor="companyContactName" className="text-xs font-semibold text-slate-700">
                  Người liên hệ <span className="text-red-500">*</span>
                </label>
                <Input
                  id="companyContactName"
                  name="companyContactName"
                  value={formData.companyContactName}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Thanh Tùng"
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>

              {/* Email liên hệ */}
              <div className="space-y-1.5">
                <label htmlFor="companyContactEmail" className="text-xs font-semibold text-slate-700">
                  Email liên hệ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="companyContactEmail"
                    name="companyContactEmail"
                    type="email"
                    value={formData.companyContactEmail}
                    onChange={handleChange}
                    placeholder="VD: tungnguyen@samsung.com"
                    className="h-9 pl-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label htmlFor="companyContactPhone" className="text-xs font-semibold text-slate-700">
                  Số điện thoại liên hệ
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="companyContactPhone"
                    name="companyContactPhone"
                    value={formData.companyContactPhone}
                    onChange={handleChange}
                    placeholder="VD: 090 123 4567"
                    className="h-9 pl-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              {/* Thương hiệu / Nhãn */}
              <div className="space-y-1.5">
                <label htmlFor="brandName" className="text-xs font-semibold text-slate-700">
                  Thương hiệu / Nhãn <span className="text-red-500">*</span>
                </label>
                <Input
                  id="brandName"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  placeholder="VD: Samsung Galaxy"
                  className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
                />
              </div>
            </div>

            {/* Địa chỉ công ty */}
            <div className="space-y-1.5 pt-1">
              <label htmlFor="companyAddress" className="text-xs font-semibold text-slate-700">
                Địa chỉ công ty
              </label>
              <Input
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                placeholder="VD: 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                className="h-9 text-xs border-slate-200 focus-visible:ring-blue-600 bg-white"
              />
            </div>
          </div>

          {/* 3. Thời gian triển khai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-xs font-semibold text-slate-700">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="h-10 text-xs border-slate-200 focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-xs font-semibold text-slate-700">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                className="h-10 text-xs border-slate-200 focus-visible:ring-blue-600"
              />
            </div>
          </div>

          {/* 4. Mô tả / ghi chú chung */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Mô tả chi tiết / Ghi chú chiến dịch
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập ghi chú quy mô, mục tiêu nghiệm thu hoặc quy định đặc thù của chiến dịch..."
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
        onCancel={handleCancel}
      />
    </div>
  );
}
