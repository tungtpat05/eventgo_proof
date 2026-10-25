'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  getAdminSubscriptionsAction,
  manualUpdateSubscriptionAction,
  batchUpdateSubscriptionsAction,
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
  Search,
  Loader2,
  Sparkles,
  CheckCircle2,
  Package,
  RotateCcw,
  FilterX,
  Users,
  Layers,
  Edit,
  Mail,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TablePagination } from '@/components/shared/table-pagination';
import { DataTableToolbar } from '@/components/shared/data-table-toolbar';

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

  // Multi-select for Batch Actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchPlan, setBatchPlan] = useState<SubscriptionPlanTier>(SubscriptionPlanTier.STARTER);
  const [batchDays, setBatchDays] = useState<number | ''>(30);

  // Single User Edit Modal
  const [selectedUser, setSelectedUser] = useState<UserSubItem | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlanTier>(SubscriptionPlanTier.FREE);
  const [daysValid, setDaysValid] = useState<number | ''>(30);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
        showToast(`Đã cập nhật gói thành công cho ${selectedUser.fullName}`);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi cập nhật gói người dùng');
      }
    });
  };

  const handleSaveBatchSub = () => {
    if (selectedUserIds.length === 0) return;
    startTransition(async () => {
      try {
        await batchUpdateSubscriptionsAction(
          selectedUserIds,
          batchPlan,
          Number(batchDays) || 30
        );
        setIsBatchModalOpen(false);
        const count = selectedUserIds.length;
        setSelectedUserIds([]);
        showToast(`Đã cập nhật gói thành công cho ${count} tài khoản`);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi cập nhật gói hàng loạt');
      }
    });
  };

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (filterPlan !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterPlan('ALL');
    setFilterStatus('ALL');
    setCurrentPage(1);
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // 2. Plan filter
    if (filterPlan !== 'ALL' && u.plan !== filterPlan) {
      return false;
    }

    // 3. Status filter
    if (filterStatus !== 'ALL' && u.status !== filterStatus) {
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

  // Checkbox Selection Logic
  const allCurrentPageSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((u) => selectedUserIds.includes(u.userId));

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentPageSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !paginatedUsers.some((u) => u.userId === id))
      );
    } else {
      const newIds = paginatedUsers.map((u) => u.userId);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getPlanBadge = (plan: SubscriptionPlanTier) => {
    const config = planConfigs.find((p) => p.tier === plan);
    const slots = config ? config.maxActiveCampaigns : plan === 'PRO' ? 20 : plan === 'STARTER' ? 5 : 2;
    const name = config ? config.name : plan === 'PRO' ? 'Gói Pro' : plan === 'STARTER' ? 'Gói Starter' : 'Gói Free';

    switch (plan) {
      case SubscriptionPlanTier.PRO:
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">
            {name} ({slots} slots)
          </Badge>
        );
      case SubscriptionPlanTier.STARTER:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">
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
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đang hoạt động
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Đã hết hạn
          </Badge>
        );
      case 'PAST_DUE':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Quá hạn
          </Badge>
        );
      case 'CANCELED':
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs gap-1.5 font-medium">
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
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Đăng Ký Gói Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi danh sách khách hàng, trạng thái hạn ngạch và xử lý thay đổi gói thuê bao.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Tổng: <strong className="text-slate-900">{users.length}</strong> khách hàng
          </span>
        </div>
      </div>

      {/* Modern DataTableToolbar */}
      <DataTableToolbar
        searchPlaceholder="Tìm theo tên hoặc email khách hàng..."
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        filters={[
          {
            id: 'plan',
            label: 'Gói dịch vụ',
            value: filterPlan,
            onChange: (v) => {
              setFilterPlan(v);
              setCurrentPage(1);
            },
            options: [
              { value: SubscriptionPlanTier.FREE, label: 'Gói Free' },
              { value: SubscriptionPlanTier.STARTER, label: 'Gói Starter' },
              { value: SubscriptionPlanTier.PRO, label: 'Gói Pro' },
            ],
            allLabel: 'Tất cả gói cước',
          },
          {
            id: 'status',
            label: 'Trạng thái',
            value: filterStatus,
            onChange: (v) => {
              setFilterStatus(v);
              setCurrentPage(1);
            },
            options: [
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'EXPIRED', label: 'Đã hết hạn' },
              { value: 'PAST_DUE', label: 'Quá hạn' },
              { value: 'CANCELED', label: 'Đã hủy' },
            ],
            allLabel: 'Tất cả trạng thái',
          },
        ]}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={resetAllFilters}
        selectedCount={selectedUserIds.length}
        onClearSelection={() => setSelectedUserIds([])}
        batchActions={
          <Button
            size="sm"
            onClick={() => setIsBatchModalOpen(true)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 px-3 rounded-lg shadow-xs cursor-pointer font-semibold"
          >
            <Layers className="h-3.5 w-3.5" />
            Đổi gói cho {selectedUserIds.length} tài khoản
          </Button>
        }
      />

      {/* Main Table Card */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Đang tải danh sách đăng ký...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      onChange={toggleSelectAllCurrentPage}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      aria-label="Chọn tất cả người dùng trang này"
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[220px]">
                    <span className="font-semibold text-slate-800">Khách hàng</span>
                  </th>
                  <th className="py-3 px-4 min-w-[160px]">
                    <span className="font-semibold text-slate-800">Gói dịch vụ</span>
                  </th>
                  <th className="py-3 px-4 min-w-[150px]">
                    <span className="font-semibold text-slate-800">Trạng thái</span>
                  </th>
                  <th className="py-3 px-4 min-w-[170px]">
                    <span className="font-semibold text-slate-800">Thời hạn hiệu lực</span>
                  </th>
                  <th className="py-3 px-4 min-w-[140px] text-right">
                    <span className="font-semibold text-slate-800">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.userId);
                  return (
                    <tr
                      key={u.userId}
                      className={cn(
                        'transition-colors',
                        isSelected ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-slate-50/70'
                      )}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(u.userId)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          aria-label={`Chọn khách hàng ${u.fullName}`}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{u.fullName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {u.email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">{getPlanBadge(u.plan)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(u.status)}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.expiresAt ? (
                          <div>
                            <span className="font-medium text-slate-800">
                              {new Date(u.expiresAt).toLocaleDateString('vi-VN')}
                            </span>
                            <p className="text-[11px] text-slate-400">
                              Hết hạn lúc 23:59
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                            Vĩnh viễn
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditUser(u)}
                          className="text-xs h-8 px-3 rounded-lg border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50 font-medium cursor-pointer transition-colors"
                        >
                          <Edit className="h-3 w-3 mr-1.5" />
                          Đổi gói
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <FilterX className="h-9 w-9 text-slate-300 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-slate-700">
                          Không tìm thấy khách hàng nào phù hợp
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc để xem toàn bộ danh sách đăng ký.
                        </p>
                        {activeFiltersCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetAllFilters}
                            className="mt-3 text-xs border-slate-200 hover:bg-slate-50 gap-1.5 cursor-pointer rounded-lg"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Xóa tất cả bộ lọc ({activeFiltersCount})
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="khách hàng"
          />
        </div>
      )}

      {/* MODAL 1: Single User Edit Plan */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Đổi Gói Dịch Vụ Khách Hàng
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Khách hàng: <strong className="text-slate-800">{selectedUser.fullName}</strong> ({selectedUser.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Chọn gói dịch vụ mới
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {planConfigs.map((p) => (
                    <button
                      key={p.tier}
                      type="button"
                      onClick={() => setEditPlan(p.tier)}
                      className={cn(
                        'p-3 rounded-xl border text-xs text-center transition-all cursor-pointer',
                        editPlan === p.tier
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                      )}
                    >
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {p.maxActiveCampaigns} chiến dịch
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {editPlan !== SubscriptionPlanTier.FREE && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
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
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gói sẽ tự động hết hạn sau {daysValid || 0} ngày kể từ thời điểm này.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex sm:justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-xs cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSaveUserSub}
                disabled={isPending}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-semibold"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Lưu Thay Đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 2: Batch Edit Subscriptions */}
      {isBatchModalOpen && (
        <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Cập Nhật Gói Hàng Loạt
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Áp dụng thay đổi cho <strong className="text-slate-900">{selectedUserIds.length} khách hàng</strong> đã chọn.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Gói dịch vụ áp dụng chung
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {planConfigs.map((p) => (
                    <button
                      key={p.tier}
                      type="button"
                      onClick={() => setBatchPlan(p.tier)}
                      className={cn(
                        'p-3 rounded-xl border text-xs text-center transition-all cursor-pointer',
                        batchPlan === p.tier
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                      )}
                    >
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {p.maxActiveCampaigns} chiến dịch
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {batchPlan !== SubscriptionPlanTier.FREE && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Thời hạn hiệu lực (Ngày)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={batchDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBatchDays(val === '' ? '' : parseInt(val, 10));
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gói của tất cả {selectedUserIds.length} tài khoản sẽ hết hạn sau {batchDays || 0} ngày.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex sm:justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBatchModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSaveBatchSub}
                disabled={isPending}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-semibold"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                )}
                Xác Nhận Đổi {selectedUserIds.length} Tài Khoản
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
