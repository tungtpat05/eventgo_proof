'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  getAdminSubscriptionsAction,
  manualUpdateSubscriptionAction,
} from '@/features/admin/actions/admin-actions';
import { SubscriptionPlanTier } from '@/domain/enums';
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
import { CreditCard, Search, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

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
  const [users, setUsers] = useState<UserSubItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Edit Modal
  const [selectedUser, setSelectedUser] = useState<UserSubItem | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlanTier>(SubscriptionPlanTier.FREE);
  const [daysValid, setDaysValid] = useState<number>(30);

  const loadData = async () => {
    try {
      const data = await getAdminSubscriptionsAction();
      setUsers(data as UserSubItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (user: UserSubItem) => {
    setSelectedUser(user);
    setEditPlan(user.plan);
    setDaysValid(30);
  };

  const handleSavePlan = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      try {
        await manualUpdateSubscriptionAction(selectedUser.userId, editPlan, daysValid);
        setSelectedUser(null);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi cập nhật gói');
      }
    });
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const getPlanBadge = (plan: SubscriptionPlanTier) => {
    switch (plan) {
      case SubscriptionPlanTier.PRO:
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Gói Pro (20 slots)</Badge>;
      case SubscriptionPlanTier.STARTER:
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Gói Starter (5 slots)</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Gói Free (2 slots)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-600" />
          Quản Lý Thuê Bao Người Dùng
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Xem danh sách khách hàng, phân bổ quota chiến dịch và can thiệp đổi gói thủ công
        </p>
      </div>

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

      {/* Users Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
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
                {filtered.map((u) => (
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
                        onClick={() => handleOpenEdit(u)}
                        className="text-xs h-8 border-slate-300 hover:border-blue-600 hover:text-blue-600"
                      >
                        Đổi gói thủ công
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Plan Edit Dialog */}
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
                  {[
                    { tier: SubscriptionPlanTier.FREE, label: 'Gói Free (2)', color: 'border-slate-300' },
                    { tier: SubscriptionPlanTier.STARTER, label: 'Starter (5)', color: 'border-blue-300' },
                    { tier: SubscriptionPlanTier.PRO, label: 'Pro (20)', color: 'border-purple-300' },
                  ].map((p) => (
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
                      {p.label}
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
                onClick={handleSavePlan}
                disabled={isPending}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                Lưu Thay Đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
