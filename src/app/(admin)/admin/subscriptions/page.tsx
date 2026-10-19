'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  getAdminSubscriptionsAction,
  manualUpdateSubscriptionAction,
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
  CreditCard,
  Search,
  Loader2,
  Sparkles,
  CheckCircle2,
  Settings2,
  Users,
  Check,
  Zap,
  ShieldCheck,
  Edit3,
  Sliders,
} from 'lucide-react';

interface UserSubItem {
  userId: string;
  fullName: string;
  email: string;
  plan: SubscriptionPlanTier;
  status: string;
  expiresAt: Date | null;
  createdAt: string;
}

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'users'>('plans');
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
  const [users, setUsers] = useState<UserSubItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal 1: Edit Plan Configuration
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formMaxCampaigns, setFormMaxCampaigns] = useState<number>(2);
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  // Modal 2: Edit User Subscription
  const [selectedUser, setSelectedUser] = useState<UserSubItem | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlanTier>(SubscriptionPlanTier.FREE);
  const [daysValid, setDaysValid] = useState<number>(30);

  const loadData = async () => {
    try {
      const [subsData, configsData] = await Promise.all([
        getAdminSubscriptionsAction(),
        getAdminPlanConfigsAction(),
      ]);
      setUsers(subsData as UserSubItem[]);
      setPlanConfigs(configsData);
    } catch (err) {
      console.error('Failed to load admin subscription data:', err);
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

  // Open Edit Plan Modal
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

  // Save Plan Configuration
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

  // Open Edit User Modal
  const handleOpenEditUser = (user: UserSubItem) => {
    setSelectedUser(user);
    setEditPlan(user.plan);
    setDaysValid(30);
  };

  // Save User Subscription
  const handleSaveUserSub = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      try {
        await manualUpdateSubscriptionAction(selectedUser.userId, editPlan, daysValid);
        setSelectedUser(null);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi cập nhật gói người dùng');
      }
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const getPlanBadge = (plan: SubscriptionPlanTier) => {
    const config = planConfigs.find((p) => p.tier === plan);
    const slots = config ? config.maxActiveCampaigns : plan === 'PRO' ? 20 : plan === 'STARTER' ? 5 : 2;
    const name = config ? config.name : plan === 'PRO' ? 'Gói Pro' : plan === 'STARTER' ? 'Gói Starter' : 'Gói Free';

    switch (plan) {
      case SubscriptionPlanTier.PRO:
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            {name} ({slots} slots)
          </Badge>
        );
      case SubscriptionPlanTier.STARTER:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {name} ({slots} slots)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
            {name} ({slots} slots)
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-600" />
          Quản Lý Thuê Bao & Biểu Phí Dịch Vụ
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cấu hình giá niêm yết, hạn mức chiến dịch (quota) và quản lý thuê bao của toàn bộ khách hàng
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'plans'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          Cấu hình các Gói Dịch Vụ ({planConfigs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Thuê bao Khách hàng ({users.length})
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : activeTab === 'plans' ? (
        /* TAB 1: PLAN CONFIGS */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Biểu phí & Hạn mức hiện thời</h2>
              <p className="text-xs text-slate-500">
                Mọi thay đổi về giá hoặc số lượng chiến dịch tối đa sẽ có hiệu lực tức thì trên cổng thanh toán và wizard tạo chiến dịch
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planConfigs.map((plan) => {
              const isFree = plan.tier === SubscriptionPlanTier.FREE;
              const isStarter = plan.tier === SubscriptionPlanTier.STARTER;
              const isPro = plan.tier === SubscriptionPlanTier.PRO;

              return (
                <div
                  key={plan.tier}
                  className={`rounded-2xl border p-5 flex flex-col justify-between bg-white transition-all shadow-sm relative ${
                    isStarter
                      ? 'border-blue-300 ring-1 ring-blue-400/30'
                      : isPro
                      ? 'border-purple-300 ring-1 ring-purple-400/30'
                      : 'border-slate-200'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
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
      ) : (
        /* TAB 2: USERS SUBSCRIPTIONS TABLE */
        <div className="space-y-4">
          {/* Search Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Gói dịch vụ</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Ngày hết hạn</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{u.fullName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">{getPlanBadge(u.plan)}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.expiresAt
                          ? new Date(u.expiresAt).toLocaleDateString('vi-VN')
                          : 'Vĩnh viễn'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditUser(u)}
                          className="text-xs h-8 border-slate-300 hover:border-blue-600 hover:text-blue-600"
                        >
                          Đổi gói thủ công
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Không tìm thấy người dùng phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Plan Config Dialog */}
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
                    onChange={(e) => setFormPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formPrice === 0 ? 'Miễn phí' : `${formPrice.toLocaleString('vi-VN')} đ`}
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
                    onChange={(e) => setFormMaxCampaigns(Math.max(1, parseInt(e.target.value, 10) || 1))}
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

      {/* MODAL 2: Manual User Plan Edit Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Đổi Gói Thuê Bao Cho Người Dùng
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Khách hàng: <strong>{selectedUser.fullName}</strong> ({selectedUser.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Chọn gói dịch vụ mới
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {planConfigs.map((p) => (
                    <button
                      key={p.tier}
                      type="button"
                      onClick={() => setEditPlan(p.tier)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        editPlan === p.tier
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        ({p.maxActiveCampaigns} slots)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {editPlan !== SubscriptionPlanTier.FREE && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Thời hạn hiệu lực (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={daysValid}
                    onChange={(e) => setDaysValid(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gói sẽ hết hạn sau {daysValid} ngày kể từ thời điểm này.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex sm:justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSaveUserSub}
                disabled={isPending}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                Lưu Thay Đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
