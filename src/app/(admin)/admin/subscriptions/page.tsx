'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  getAdminSubscriptionsAction,
  manualUpdateSubscriptionAction,
  getAdminPlanConfigsAction,
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
  RefreshCw,
  Search,
  Loader2,
  Sparkles,
  CheckCircle2,
  Package,
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
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
  const [users, setUsers] = useState<UserSubItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal: Edit User Subscription
  const [selectedUser, setSelectedUser] = useState<UserSubItem | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlanTier>(SubscriptionPlanTier.FREE);
  const [daysValid, setDaysValid] = useState<number | ''>(30);

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

  const handleOpenEditUser = (user: UserSubItem) => {
    setSelectedUser(user);
    setEditPlan(user.plan);
    setDaysValid(30);
  };

  const handleSaveUserSub = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      try {
        await manualUpdateSubscriptionAction(
          selectedUser.userId,
          editPlan,
          Number(daysValid) || 30
        );
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-blue-600" />
            Quản Lý Đăng Ký Thuê Bao
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi danh sách khách hàng đang sử dụng dịch vụ, gói hiện tại, thời hạn hiệu lực và điều chỉnh gói thủ công
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search Filter & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Table */}
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
                          className="text-xs h-8 border-slate-300 hover:border-blue-600 hover:text-blue-600 font-medium"
                        >
                          Đổi gói thủ công
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Không tìm thấy người dùng phù hợp với từ khóa
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manual User Plan Edit Dialog */}
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
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${editPlan === p.tier
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setDaysValid(val === '' ? '' : parseInt(val, 10));
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gói sẽ hết hạn sau {daysValid || 0} ngày kể từ thời điểm này.
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
