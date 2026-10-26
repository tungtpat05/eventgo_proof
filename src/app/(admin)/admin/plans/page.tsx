'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  getAdminPlanConfigsAction,
  updateAdminPlanConfigAction,
} from '@/features/admin/actions/admin-actions';
import { SubscriptionPlanTier } from '@/domain/enums';
import { PlanConfig, PLAN_CONFIGS } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  CheckCircle2,
  Settings2,
  Check,
  Edit3,
  Package,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function AdminPlansPage() {
  const t = useTranslations('admin.plans');
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal: Edit Plan Configuration
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>(0);
  const [formMaxCampaigns, setFormMaxCampaigns] = useState<number | ''>(2);
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const configsData = await getAdminPlanConfigsAction();
      setPlanConfigs(configsData);
    } catch (err) {
      console.error('Failed to load plan configs:', err);
      // Fallback statically configured plans
      setPlanConfigs([
        PLAN_CONFIGS[SubscriptionPlanTier.FREE],
        PLAN_CONFIGS[SubscriptionPlanTier.STARTER],
        PLAN_CONFIGS[SubscriptionPlanTier.PRO],
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditPlan = (plan: PlanConfig) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormPrice(plan.priceMonthlyVnd);
    setFormMaxCampaigns(plan.maxActiveCampaigns);
    setFormDescription(plan.description);
    setFormFeatures(plan.features ? plan.features.join('\n') : '');
    setFormIsPopular(plan.isPopular);
    setFormIsActive(plan.isActive);
    setFormError(null);
  };

  const handleSavePlanConfig = () => {
    if (!editingPlan) return;

    if (!formName.trim()) {
      setFormError(t('errNameRequired'));
      return;
    }

    if (formPrice === '' || formPrice < 0) {
      setFormError(t('errPriceInvalid'));
      return;
    }

    if (formMaxCampaigns === '' || formMaxCampaigns < 1) {
      setFormError(t('errMaxCampaignsMin'));
      return;
    }

    setFormError(null);

    startTransition(async () => {
      try {
        const featureLines = formFeatures
          .split('\n')
          .map((f) => f.trim())
          .filter((f) => f.length > 0);

        await updateAdminPlanConfigAction(editingPlan.tier, {
          name: formName.trim(),
          priceMonthlyVnd: Number(formPrice),
          maxActiveCampaigns: Number(formMaxCampaigns),
          description: formDescription.trim(),
          features: featureLines,
          isPopular: formIsPopular,
          isActive: formIsActive,
        });

        setEditingPlan(null);
        await loadData();
      } catch (err: any) {
        setFormError(err.message || 'Lỗi khi lưu cấu hình gói dịch vụ');
      }
    });
  };

  // Resolve Free, Starter, Pro configs reliably
  const freePlan =
    planConfigs.find((p) => p.tier === SubscriptionPlanTier.FREE) ||
    PLAN_CONFIGS[SubscriptionPlanTier.FREE];
  const starterPlan =
    planConfigs.find((p) => p.tier === SubscriptionPlanTier.STARTER) ||
    PLAN_CONFIGS[SubscriptionPlanTier.STARTER];
  const proPlan =
    planConfigs.find((p) => p.tier === SubscriptionPlanTier.PRO) ||
    PLAN_CONFIGS[SubscriptionPlanTier.PRO];

  const plans = [freePlan, starterPlan, proPlan];

  // Helper for matrix check/dash indicators
  const renderCheckOrDash = (isEnabled: boolean) => {
    if (isEnabled) {
      return (
        <div className="flex justify-center items-center">
          <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-center items-center">
        <span className="text-slate-300 font-semibold text-sm select-none">—</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            {t('title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('desc')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            loadData();
          }}
          disabled={isLoading}
          className="text-xs h-8 border-slate-300 gap-1.5 self-start sm:self-auto cursor-pointer hover:bg-slate-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', isLoading && 'animate-spin')} />
          {t('refresh')}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">{t('loading')}</p>
        </div>
      ) : (
        /* Subscription Plan Comparison Table */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              {/* TABLE HEADER */}
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
                  <th className="py-4 px-5 text-left font-semibold w-[34%] min-w-[260px] sticky left-0 bg-slate-50/95 z-20 backdrop-blur-xs shadow-[1px_0_0_0_#e2e8f0]">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      {t('featuresHeader')}
                    </span>
                  </th>
                  {plans.map((plan) => {
                    const isStarter = plan.tier === SubscriptionPlanTier.STARTER;
                    const isPro = plan.tier === SubscriptionPlanTier.PRO;

                    return (
                      <th
                        key={plan.tier}
                        className={cn(
                          'py-4 px-4 text-center w-[22%] min-w-[170px] border-l border-slate-200/80',
                          isStarter && 'bg-blue-50/25',
                          isPro && 'bg-purple-50/20'
                        )}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {plan.name}
                          </span>

                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-medium px-2 py-0.5 gap-1',
                                plan.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  plan.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                )}
                              />
                              {plan.isActive ? t('statusActive') : t('statusInactive')}
                            </Badge>

                            {plan.isPopular && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-medium px-1.5 py-0.5 gap-1"
                              >
                                <Sparkles className="h-2.5 w-2.5 text-blue-600" />
                                {t('popular')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* ========================================================= */}
                {/* NHÓM 1: THÔNG TIN GÓI */}
                {/* ========================================================= */}
                <tr className="bg-slate-100/80 border-y border-slate-200">
                  <td
                    colSpan={4}
                    className="py-2.5 px-5 font-bold text-xs uppercase tracking-wider text-slate-700"
                  >
                    {t('groupPlanInfo')}
                  </td>
                </tr>

                {/* Hàng: Giá hàng tháng */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    {t('monthlyPrice')}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.tier}
                      className="py-3.5 px-4 text-center border-l border-slate-100 font-bold text-slate-900"
                    >
                      {plan.priceMonthlyVnd === 0
                        ? t('free')
                        : t('pricePerMonth', { price: plan.priceMonthlyVnd.toLocaleString('vi-VN') })}
                    </td>
                  ))}
                </tr>

                {/* ========================================================= */}
                {/* NHÓM 2: GIỚI HẠN SỬ DỤNG */}
                {/* ========================================================= */}
                <tr className="bg-slate-100/80 border-y border-slate-200">
                  <td
                    colSpan={4}
                    className="py-2.5 px-5 font-bold text-xs uppercase tracking-wider text-slate-700"
                  >
                    {t('groupUsageLimits')}
                  </td>
                </tr>

                {/* Hàng: Chiến dịch đang hoạt động */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    {t('activeCampaigns')}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.tier}
                      className="py-3.5 px-4 text-center border-l border-slate-100 font-semibold text-slate-800"
                    >
                      {t('campaignUnit', { count: plan.maxActiveCampaigns })}
                    </td>
                  ))}
                </tr>

                {/* Hàng: Dung lượng lưu trữ */}
                {/* TODO: Giới hạn dung lượng lưu trữ chưa được triển khai */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    <div className="flex items-center gap-2">
                      <span>{t('storageQuota')}</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                        {t('storageNotApplied')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100 text-slate-700 font-medium">
                    1 GB
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100 text-slate-700 font-medium">
                    10 GB
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100 text-slate-700 font-medium">
                    100 GB
                  </td>
                </tr>

                {/* Hàng: Thành viên tham gia */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    {t('membersCount')}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.tier}
                      className="py-3.5 px-4 text-center border-l border-slate-100 text-slate-700"
                    >
                      {plan.maxParticipants === null
                        ? t('unlimited')
                        : t('memberUnit', { count: plan.maxParticipants })}
                    </td>
                  ))}
                </tr>

                {/* Hàng: Địa điểm và gian hàng */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    {t('locationsAndBooths')}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.tier}
                      className="py-3.5 px-4 text-center border-l border-slate-100 text-slate-700"
                    >
                      {plan.maxBooths === null ? t('unlimited') : t('locationUnit', { count: plan.maxBooths })}
                    </td>
                  ))}
                </tr>

                {/* ========================================================= */}
                {/* NHÓM 3: TÍNH NĂNG NÂNG CAO */}
                {/* ========================================================= */}
                <tr className="bg-slate-100/80 border-y border-slate-200">
                  <td
                    colSpan={4}
                    className="py-2.5 px-5 font-bold text-xs uppercase tracking-wider text-slate-700"
                  >
                    {t('groupAdvancedFeatures')}
                  </td>
                </tr>

                {/* Hàng: Nhân bản chiến dịch */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    <div className="flex items-center gap-1.5">
                      <span>{t('cloneCampaign')}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{t('planned')}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(true)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(true)}
                  </td>
                </tr>

                {/* Hàng: Mẫu chiến dịch có sẵn */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    <div className="flex items-center gap-1.5">
                      <span>{t('presetTemplates')}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{t('planned')}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(true)}
                  </td>
                </tr>

                {/* Hàng: Xuất báo cáo Excel/PDF */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    <div className="flex items-center gap-1.5">
                      <span>{t('exportReports')}</span>
                      <span className="text-[10px] text-emerald-600 font-normal">
                        {t('excelSupported')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(true)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(true)}
                  </td>
                </tr>

                {/* Hàng: Báo cáo tổng hợp nhiều chiến dịch */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    <div className="flex items-center gap-1.5">
                      <span>{t('multiCampaignReport')}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{t('planned')}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(true)}
                  </td>
                </tr>

                {/* Hàng: Hỗ trợ kỹ thuật 24/7 */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    {t('support247')}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(false)}
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-slate-100">
                    {renderCheckOrDash(true)}
                  </td>
                </tr>

                {/* ========================================================= */}
                {/* NHÓM 4: THAO TÁC QUẢN TRỊ */}
                {/* ========================================================= */}
                <tr className="bg-slate-50/90 border-t-2 border-slate-200">
                  <td className="py-4 px-5 font-semibold text-slate-700 sticky left-0 bg-slate-50/95 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                    {t('groupAdminActions')}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.tier}
                      className="py-4 px-4 text-center border-l border-slate-100"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditPlan(plan)}
                        className="text-xs h-8 px-3.5 border-slate-300 hover:border-blue-600 hover:text-blue-600 font-medium cursor-pointer gap-1.5 shadow-2xs hover:bg-blue-50/40"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {t('edit')}
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Edit Plan Config Dialog */}
      {editingPlan && (
        <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
          <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-600" />
                {t('dialogEditTitle', { name: editingPlan.name })}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {t('systemCode', { tier: editingPlan.tier })}
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 py-3 text-xs">
              {/* Tên hiển thị */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('fieldName')}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Ví dụ: Gói Starter"
                />
              </div>

              {/* Giá & Hạn mức Chiến dịch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {t('fieldPrice')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormPrice(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formPrice === '' || formPrice === 0
                      ? t('free')
                      : `${Number(formPrice).toLocaleString('vi-VN')} đ`}
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {t('fieldMaxCampaigns')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formMaxCampaigns}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormMaxCampaigns(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">{t('fieldMaxCampaignsHelp')}</p>
                </div>
              </div>

              {/* Mô tả tóm tắt */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('fieldDescription')}
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Mô tả đối tượng khách hàng mục tiêu"
                />
              </div>

              {/* Danh sách tính năng */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {t('fieldFeatures')}
                </label>
                <textarea
                  rows={4}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                  placeholder={t('fieldFeaturesPlaceholder')}
                />
              </div>

              {/* Checkboxes: Phổ biến & Kích hoạt */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">
                    {t('fieldIsPopular')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">
                    {t('fieldIsActive')}
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingPlan(null)}
                className="text-xs cursor-pointer"
              >
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSavePlanConfig}
                disabled={isPending}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                {t('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

