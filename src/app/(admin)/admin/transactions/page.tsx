'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getAdminTransactionsAction } from '@/features/admin/actions/admin-actions';
import { Transaction, TransactionStatus } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, cn } from '@/lib/utils';
import {
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  FilterX,
} from 'lucide-react';
import { TablePagination } from '@/components/shared/table-pagination';
import {
  ColumnSearchInput,
  ColumnSelect,
  ColumnHeaderTitle,
} from '@/components/shared/column-filter-inputs';

interface ExtendedTransaction extends Transaction {
  userFullName: string;
  userEmail: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination (8 items per page)
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Column Filters State
  const [filterCode, setFilterCode] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [filterProvider, setFilterProvider] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTime, setFilterTime] = useState<string>('ALL');

  const activeFiltersCount =
    (filterCode.trim() ? 1 : 0) +
    (filterCustomer.trim() ? 1 : 0) +
    (filterPlan !== 'ALL' ? 1 : 0) +
    (filterProvider !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (filterTime !== 'ALL' ? 1 : 0);

  const resetAllFilters = () => {
    setFilterCode('');
    setFilterCustomer('');
    setFilterPlan('ALL');
    setFilterProvider('ALL');
    setFilterStatus('ALL');
    setFilterTime('ALL');
    setCurrentPage(1);
  };

  const loadData = async () => {
    try {
      const data = await getAdminTransactionsAction();
      setTransactions(data as ExtendedTransaction[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const matchesTimeFilter = (createdAtDate: Date | string, filter: string): boolean => {
    if (filter === 'ALL') return true;
    const d = new Date(createdAtDate);
    const now = new Date();

    if (filter === 'TODAY') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (filter === 'LAST_7_DAYS') {
      const diff = now.getTime() - d.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }
    if (filter === 'LAST_30_DAYS') {
      const diff = now.getTime() - d.getTime();
      return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
    }
    if (filter === 'THIS_MONTH') {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    return true;
  };

  // Filtered List
  const filtered = transactions.filter((t) => {
    // 1. Transaction Code
    if (filterCode.trim()) {
      const q = filterCode.toLowerCase().trim();
      if (!t.transactionCode.toLowerCase().includes(q)) {
        return false;
      }
    }

    // 2. Customer
    if (filterCustomer.trim()) {
      const q = filterCustomer.toLowerCase().trim();
      const matchName = t.userFullName?.toLowerCase().includes(q);
      const matchEmail = t.userEmail?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // 3. Plan / Amount
    if (filterPlan !== 'ALL') {
      if (filterPlan === 'PAID') {
        if (t.amount <= 0) return false;
      } else if (t.plan !== filterPlan) {
        return false;
      }
    }

    // 4. Provider
    if (filterProvider !== 'ALL' && t.provider !== filterProvider) {
      return false;
    }

    // 5. Status
    if (filterStatus !== 'ALL' && t.status !== filterStatus) {
      return false;
    }

    // 6. Time range
    if (!matchesTimeFilter(t.createdAt, filterTime)) {
      return false;
    }

    return true;
  });

  // Pagination (8 items per page)
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedTransactions = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert('Không có dữ liệu giao dịch để xuất Excel');
      return;
    }

    const data = filtered.map((t, idx) => ({
      STT: idx + 1,
      'Mã Đơn': t.transactionCode,
      'Khách Hàng': t.userFullName,
      Email: t.userEmail,
      'Gói Mua': t.plan,
      'Số Tiền (VND)': t.amount,
      'Phương Thức': t.provider === 'PAYOS_VIETQR' ? 'VietQR PayOS' : 'Chuyển khoản',
      'Trạng Thái': t.status,
      'Thời Gian Tạo': formatDateTime(t.createdAt),
      'Thời Gian Thanh Toán': t.paidAt ? formatDateTime(t.paidAt) : 'Chưa thanh toán',
      'Ghi Chú': t.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Giao_Dich');
    XLSX.writeFile(wb, `EventGo_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Thành công
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">
            <Clock className="h-3 w-3 text-amber-600" />
            Chờ thanh toán
          </Badge>
        );
      case TransactionStatus.CANCELLED:
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1 text-xs">
            <XCircle className="h-3 w-3 text-slate-500" />
            Đã hủy
          </Badge>
        );
      case TransactionStatus.REFUNDED:
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 gap-1 text-xs">
            <AlertCircle className="h-3 w-3 text-purple-600" />
            Đã hoàn tiền
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-xs">
            <XCircle className="h-3 w-3 text-rose-600" />
            {status}
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
            <Receipt className="h-6 w-6 text-emerald-600" />
            Quản Lý Giao Dịch & Dòng Tiền
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi và đối soát các giao dịch thanh toán tự động VietQR PayOS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất Excel ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Transactions Table with Column Filtering */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                {/* Row 1: Header Titles */}
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4 min-w-[130px]">
                    <ColumnHeaderTitle
                      label="Mã đơn"
                      isFiltered={Boolean(filterCode.trim())}
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[210px]">
                    <ColumnHeaderTitle
                      label="Khách hàng"
                      isFiltered={Boolean(filterCustomer.trim())}
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[160px]">
                    <ColumnHeaderTitle
                      label="Gói & Số tiền"
                      isFiltered={filterPlan !== 'ALL'}
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[140px]">
                    <ColumnHeaderTitle
                      label="Cổng"
                      isFiltered={filterProvider !== 'ALL'}
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[150px]">
                    <ColumnHeaderTitle
                      label="Trạng thái"
                      isFiltered={filterStatus !== 'ALL'}
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[170px]">
                    <ColumnHeaderTitle
                      label="Thời gian"
                      isFiltered={filterTime !== 'ALL'}
                    />
                  </th>
                </tr>

                {/* Row 2: Column Filter Controls */}
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600">
                  <th className="py-2 px-4">
                    <ColumnSearchInput
                      value={filterCode}
                      onChange={(v) => {
                        setFilterCode(v);
                        setCurrentPage(1);
                      }}
                      placeholder="Tìm mã..."
                    />
                  </th>
                  <th className="py-2 px-4">
                    <ColumnSearchInput
                      value={filterCustomer}
                      onChange={(v) => {
                        setFilterCustomer(v);
                        setCurrentPage(1);
                      }}
                      placeholder="Tên hoặc email..."
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
                        { value: 'FREE', label: 'Gói Free' },
                        { value: 'STARTER', label: 'Gói Starter' },
                        { value: 'PRO', label: 'Gói Pro' },
                      ]}
                    />
                  </th>
                  <th className="py-2 px-4">
                    <ColumnSelect
                      value={filterProvider}
                      onChange={(v) => {
                        setFilterProvider(v);
                        setCurrentPage(1);
                      }}
                      allLabel="Tất cả cổng"
                      options={[
                        { value: 'PAYOS_VIETQR', label: 'VietQR PayOS' },
                      ]}
                    />
                  </th>
                  <th className="py-2 px-4">
                    <ColumnSelect
                      value={filterStatus}
                      onChange={(v) => {
                        setFilterStatus(v);
                        setCurrentPage(1);
                      }}
                      allLabel="Tất cả trạng thái"
                      options={[
                        { value: TransactionStatus.PENDING, label: 'Chờ thanh toán' },
                        { value: TransactionStatus.SUCCESS, label: 'Thành công' },
                        { value: TransactionStatus.FAILED, label: 'Thất bại' },
                      ]}
                    />
                  </th>
                  <th className="py-2 px-4">
                    <ColumnSelect
                      value={filterTime}
                      onChange={(v) => {
                        setFilterTime(v);
                        setCurrentPage(1);
                      }}
                      allLabel="Tất cả thời gian"
                      options={[
                        { value: 'TODAY', label: 'Hôm nay' },
                        { value: 'LAST_7_DAYS', label: '7 ngày qua' },
                        { value: 'LAST_30_DAYS', label: '30 ngày qua' },
                        { value: 'THIS_MONTH', label: 'Tháng này' },
                      ]}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {t.transactionCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{t.userFullName}</p>
                      <p className="text-xs text-slate-500">{t.userEmail}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">
                        {t.amount.toLocaleString('vi-VN')} {t.currency}
                      </p>
                      <span className="text-xs text-blue-600 font-medium">{t.plan}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {t.provider === 'PAYOS_VIETQR' ? 'VietQR PayOS' : 'Chuyển khoản'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <p className="font-medium text-slate-700">{formatDateTime(t.createdAt)}</p>
                      {t.paidAt && (
                        <p className="text-[11px] text-emerald-600 font-medium">
                          Đã trả: {formatDateTime(t.paidAt)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <FilterX className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">
                          Không tìm thấy giao dịch nào phù hợp với bộ lọc
                        </p>
                        <p className="text-xs text-slate-400">
                          Thử điều chỉnh hoặc xóa các tiêu chí lọc để xem thêm giao dịch
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
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName="giao dịch"
          />
        </div>
      )}
    </div>
  );
}
