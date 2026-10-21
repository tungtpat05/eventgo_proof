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
  RotateCcw,
  FilterX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TablePagination } from '@/components/shared/table-pagination';
import {
  ColumnSearchInput,
  ColumnSelect,
  ColumnHeaderTitle,
} from '@/components/shared/column-filter-inputs';

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

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Column Filters State
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');

  const activeFiltersCount =
    (filterCustomer.trim() ? 1 : 0) +
    (filterPlan !== 'ALL' ? 1 : 0);

  const resetAllFilters = () => {
    setFilterCustomer('');
    setFilterPlan('ALL');
    setCurrentPage(1);
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    // 1. Customer name / email
    if (filterCustomer.trim()) {
      const q = filterCustomer.toLowerCase().trim();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // 2. Plan filter
    if (filterPlan !== 'ALL' && u.plan !== filterPlan) {
      return false;
    }

    return true;
  });

  // Pagination (8 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đang hoạt động
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Đã hết hạn
          </Badge>
        );
      case 'PAST_DUE':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Quá hạn
          </Badge>
        );
      case 'CANCELED':
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Đã hủy
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-blue-600" />
          Quản Lý Đăng Ký Thuê Bao
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi danh sách khách hàng đang sử dụng dịch vụ, gói hiện tại, thời hạn hiệu lực và điều chỉnh gói thủ công
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table with Column Filtering */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  {/* Row 1: Header Titles */}
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                    <th className="py-3 px-4 min-w-[220px]">
                      <ColumnHeaderTitle
                        label="Khách hàng"
                        isFiltered={Boolean(filterCustomer.trim())}
                      />
                    </th>
                    <th className="py-3 px-4 min-w-[160px]">
                      <ColumnHeaderTitle
                        label="Gói dịch vụ"
                        isFiltered={filterPlan !== 'ALL'}
                      />
                    </th>
                    <th className="py-3 px-4 min-w-[150px]">
                      <span className="font-semibold text-slate-700">Trạng thái</span>
                    </th>
                    <th className="py-3 px-4 min-w-[180px]">
                      <span className="font-semibold text-slate-700">Ngày hết hạn</span>
                    </th>
                    <th className="py-3 px-4 min-w-[140px] text-right">
                      <span className="font-semibold text-slate-700">Thao tác</span>
                    </th>
                  </tr>

                  {/* Row 2: Column Filter Controls */}
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600">
                    <th className="py-2 px-4">
                      <ColumnSearchInput
                        value={filterCustomer}
                        onChange={(v) => {
                          setFilterCustomer(v);
                          setCurrentPage(1);
                        }}
                        placeholder="Tìm tên hoặc email..."
                      />
                    </th>
                    <th className="py-2 px-4">
                      <ColumnSelect
                        value={filterPlan}
                        onChange={(v) => {
                          setFilterPlan(v);
                          setCurrentPage(1);
                        }}
                        allLabel="Tất cả gói"
                        options={[
                          { value: SubscriptionPlanTier.FREE, label: 'Gói Free' },
                          { value: SubscriptionPlanTier.STARTER, label: 'Gói Starter' },
                          { value: SubscriptionPlanTier.PRO, label: 'Gói Pro' },
                        ]}
                      />
                    </th>
                    <th className="py-2 px-4">
                      <span className="text-[11px] text-slate-300 font-normal">--</span>
                    </th>
                    <th className="py-2 px-4">
                      <span className="text-[11px] text-slate-300 font-normal">--</span>
                    </th>
                    <th className="py-2 px-4 text-right">
                      {activeFiltersCount > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={resetAllFilters}
                          className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 font-medium cursor-pointer"
                          title="Xóa tất cả bộ lọc"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Xóa lọc
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-normal pr-2">--</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{u.fullName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">{getPlanBadge(u.plan)}</td>
                      <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
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
                          className="text-xs h-8 border-slate-300 hover:border-blue-600 hover:text-blue-600 font-medium cursor-pointer"
                        >
                          Đổi gói thủ công
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <FilterX className="h-8 w-8 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">
                            Không tìm thấy khách hàng nào phù hợp với bộ lọc
                          </p>
                          <p className="text-xs text-slate-400">
                            Thử điều chỉnh hoặc xóa các tiêu chí lọc để xem thêm kết quả
                          </p>
                          {activeFiltersCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetAllFilters}
                              className="mt-2 text-xs border-slate-200 hover:bg-slate-50 gap-1.5"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Xóa tất cả bộ lọc
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (8 items per page) */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemName="khách hàng"
            />
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
