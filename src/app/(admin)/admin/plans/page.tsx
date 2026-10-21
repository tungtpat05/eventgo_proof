'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
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
  Package,
  Loader2,
  CheckCircle2,
  Settings2,
  Check,
  Zap,
  ShieldCheck,
  Edit3,
  Users,
  Sparkles,
} from 'lucide-react';

export default function AdminPlansPage() {
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

  const loadData = async () => {
    try {
      const configsData = await getAdminPlanConfigsAction();
      setPlanConfigs(configsData);
    } catch (err) {
      console.error('Failed to load plan configs:', err);
      // Fallback
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
  };

  const handleSavePlanConfig = () => {
    if (!editingPlan) return;
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
        alert(err.message || 'Lỗi lưu cấu hình gói');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Cấu Hình Gói Dịch Vụ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh mục gói dịch vụ, giá niêm yết, hạn mức chiến dịch đồng thời và các đặc quyền đi kèm
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planConfigs.map((plan) => {
              const isStarter = plan.tier === SubscriptionPlanTier.STARTER;
              const isPro = plan.tier === SubscriptionPlanTier.PRO;

              return (
                <div
                  key={plan.tier}
                  className={`rounded-2xl border p-5 flex flex-col justify-between bg-white transition-all shadow-sm relative ${isStarter
                    ? 'border-blue-300 ring-1 ring-blue-400/30'
                    : isPro
                      ? 'border-purple-300 ring-1 ring-purple-400/30'
                      : 'border-slate-200'
                    }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Phổ biến nhất
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Card Top */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {isStarter && <Zap className="h-4 w-4 text-amber-500" />}
                          {isPro && <ShieldCheck className="h-4 w-4 text-purple-600" />}
                          <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                        </div>
                        <span className="text-[11px] font-mono font-medium text-slate-400">
                          {plan.tier}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          plan.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]'
                            : 'bg-slate-100 text-slate-500 border-slate-200 text-[10px]'
                        }
                      >
                        {plan.isActive ? 'Đang mở bán' : 'Tạm ẩn'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 min-h-[32px] mb-3">
                      {plan.description || 'Chưa có mô tả'}
                    </p>

                    {/* Price & Quota Box */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Giá niêm yết:</span>
                        <span className="text-base font-extrabold text-slate-900">
                          {plan.priceMonthlyVnd === 0
                            ? 'Miễn phí'
                            : `${plan.priceMonthlyVnd.toLocaleString('vi-VN')} đ/tháng`}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Hạn mức Active:</span>
                        <span className="text-xs font-bold text-blue-600">
                          {plan.maxActiveCampaigns} Chiến dịch song song
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Đặc quyền gói ({plan.features ? plan.features.length : 0})
                      </span>
                      {plan.features && plan.features.length > 0 ? (
                        plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-slate-700 leading-snug">{feat}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Chưa cấu hình tính năng</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditPlan(plan)}
                      className="w-full text-xs h-8 border-slate-300 hover:border-blue-600 hover:text-blue-600 gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Chỉnh sửa cấu hình gói
                    </Button>
                  </div>
                </div>
              );
            })}
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
                Chỉnh Sửa Cấu Hình {editingPlan.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Mã hệ thống: <strong className="font-mono text-slate-800">{editingPlan.tier}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Plan Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên hiển thị của gói
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Ví dụ: Gói Starter"
                />
              </div>

              {/* Price & Max Campaigns in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Giá niêm yết (VND / tháng)
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
                      ? 'Miễn phí'
                      : `${Number(formPrice).toLocaleString('vi-VN')} đ`}
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Hạn mức Active cùng lúc
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
                  <p className="text-[11px] text-slate-400 mt-0.5">Số chiến dịch tối đa</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mô tả tóm tắt
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Mô tả đối tượng khách hàng mục tiêu"
                />
              </div>

              {/* Features List */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Danh sách tính năng đặc quyền (Mỗi dòng một tính năng)
                </label>
                <textarea
                  rows={4}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                  placeholder="Ví dụ:&#10;5 Chiến dịch hoạt động cùng lúc&#10;Không giới hạn Booths & Người tham gia&#10;Thư viện mẫu Checklist chuẩn hóa"
                />
              </div>

              {/* Checkboxes: Popular & Active */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">
                    Gắn nhãn &quot;Phổ biến nhất&quot; (Hiển thị nổi bật trên trang thanh toán)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">
                    Kích hoạt hiển thị cho khách hàng lựa chọn
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingPlan(null)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSavePlanConfig}
                disabled={isPending}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                Lưu Cấu Hình
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
