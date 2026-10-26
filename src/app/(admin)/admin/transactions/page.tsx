'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getAdminTransactionsAction } from '@/features/admin/actions/admin-actions';
import { Transaction, TransactionStatus } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, cn } from '@/lib/utils';
import {
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  FilterX,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { TablePagination } from '@/components/shared/table-pagination';
import { DataTableToolbar } from '@/components/shared/data-table-toolbar';
import { useTranslations } from 'next-intl';

interface ExtendedTransaction extends Transaction {
  userFullName: string;
  userEmail: string;
}

export default function AdminTransactionsPage() {
  const t = useTranslations('admin.transactions');
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination (8 items per page)
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Toolbar Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [filterProvider, setFilterProvider] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTime, setFilterTime] = useState<string>('ALL');

  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (filterPlan !== 'ALL' ? 1 : 0) +
    (filterProvider !== 'ALL' ? 1 : 0) +
    (filterStatus !== 'ALL' ? 1 : 0) +
    (filterTime !== 'ALL' ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
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
    // 1. Universal Search (Code, Customer name, Email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = t.transactionCode?.toLowerCase().includes(q);
      const matchName = t.userFullName?.toLowerCase().includes(q);
      const matchEmail = t.userEmail?.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchEmail) return false;
    }

    // 2. Plan / Amount
    if (filterPlan !== 'ALL') {
      if (filterPlan === 'PAID') {
        if (t.amount <= 0) return false;
      } else if (t.plan !== filterPlan) {
        return false;
      }
    }

    // 3. Provider
    if (filterProvider !== 'ALL' && t.provider !== filterProvider) {
      return false;
    }

    // 4. Status
    if (filterStatus !== 'ALL' && t.status !== filterStatus) {
      return false;
    }

    // 5. Time range
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
      alert(t('excelNoDataAlert'));
      return;
    }

    const data = filtered.map((item, idx) => ({
      [t('colSTT')]: idx + 1,
      [t('colExcelOrder')]: item.transactionCode,
      [t('colExcelCustomer')]: item.userFullName,
      [t('colExcelEmail')]: item.userEmail,
      [t('colExcelPlan')]: item.plan,
      [t('colExcelAmount')]: item.amount,
      [t('colExcelMethod')]: item.provider === 'PAYOS_VIETQR' ? 'VietQR PayOS' : t('transferManual'),
      [t('colExcelStatus')]: item.status,
      [t('colExcelCreatedAt')]: formatDateTime(item.createdAt),
      [t('colExcelPaidAt')]: item.paidAt ? formatDateTime(item.paidAt) : t('unpaid'),
      [t('colExcelNotes')]: item.notes || '',
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
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 text-xs font-medium">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {t('statusSuccess')}
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 text-xs font-medium">
            <Clock className="h-3 w-3 text-amber-600" />
            {t('statusPending')}
          </Badge>
        );
      case TransactionStatus.CANCELLED:
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1.5 text-xs font-medium">
            <XCircle className="h-3 w-3 text-slate-500" />
            {t('statusCancelled')}
          </Badge>
        );
      case TransactionStatus.REFUNDED:
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 gap-1.5 text-xs font-medium">
            <AlertCircle className="h-3 w-3 text-purple-600" />
            {t('statusRefunded')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1.5 text-xs font-medium">
            <XCircle className="h-3 w-3 text-rose-600" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('desc')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {t('totalTxns', { count: transactions.length })}
          </span>
        </div>
      </div>

      {/* Modern DataTableToolbar with Filters & Excel Export */}
      <DataTableToolbar
        searchPlaceholder={t('searchPlaceholder')}
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        filters={[
          {
            id: 'plan',
            label: t('filterPlan'),
            value: filterPlan,
            onChange: (v) => {
              setFilterPlan(v);
              setCurrentPage(1);
            },
            options: [
              { value: 'FREE', label: 'Gói Free' },
              { value: 'STARTER', label: 'Gói Starter' },
              { value: 'PRO', label: 'Gói Pro' },
            ],
            allLabel: t('allPlans'),
          },
          {
            id: 'status',
            label: t('filterStatus'),
            value: filterStatus,
            onChange: (v) => {
              setFilterStatus(v);
              setCurrentPage(1);
            },
            options: [
              { value: TransactionStatus.SUCCESS, label: t('statusSuccess') },
              { value: TransactionStatus.PENDING, label: t('statusPending') },
              { value: TransactionStatus.CANCELLED, label: t('statusCancelled') },
              { value: TransactionStatus.REFUNDED, label: t('statusRefunded') },
            ],
            allLabel: t('allStatuses'),
          },
          {
            id: 'provider',
            label: t('filterProvider'),
            value: filterProvider,
            onChange: (v) => {
              setFilterProvider(v);
              setCurrentPage(1);
            },
            options: [
              { value: 'PAYOS_VIETQR', label: 'VietQR PayOS' },
            ],
            allLabel: t('allGateways'),
          },
          {
            id: 'time',
            label: t('filterTime'),
            value: filterTime,
            onChange: (v) => {
              setFilterTime(v);
              setCurrentPage(1);
            },
            options: [
              { value: 'TODAY', label: t('filterToday') },
              { value: 'LAST_7_DAYS', label: t('filterLast7Days') },
              { value: 'LAST_30_DAYS', label: t('filterLast30Days') },
              { value: 'THIS_MONTH', label: t('filterThisMonth') },
            ],
            allLabel: t('allTimes'),
          },
        ]}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={resetAllFilters}
        actions={
          <Button
            size="sm"
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 disabled:opacity-50 h-9 px-3.5 rounded-xl shadow-xs cursor-pointer font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            {t('exportExcel', { count: filtered.length })}
          </Button>
        }
      />

      {/* Main Table Card */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs text-slate-500">{t('loading')}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-semibold">
                  <th className="py-3 px-4 min-w-[140px]">
                    <span className="font-semibold text-slate-800">{t('colCode')}</span>
                  </th>
                  <th className="py-3 px-4 min-w-[210px]">
                    <span className="font-semibold text-slate-800">{t('colCustomer')}</span>
                  </th>
                  <th className="py-3 px-4 min-w-[160px]">
                    <span className="font-semibold text-slate-800">{t('colPlanAmount')}</span>
                  </th>
                  <th className="py-3 px-4 min-w-[140px]">
                    <span className="font-semibold text-slate-800">{t('colMethod')}</span>
                  </th>
                  <th className="py-3 px-4 min-w-[150px]">
                    <span className="font-semibold text-slate-800">{t('colStatus')}</span>
                  </th>
                  <th className="py-3 px-4 min-w-[170px]">
                    <span className="font-semibold text-slate-800">{t('colTime')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 text-xs">
                      {tx.transactionCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{tx.userFullName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{tx.userEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">
                        {tx.amount.toLocaleString('vi-VN')} {tx.currency}
                      </p>
                      <span className="inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-0.5">
                        {tx.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        {tx.provider === 'PAYOS_VIETQR' ? 'VietQR PayOS' : t('transferManual')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(tx.status)}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium text-slate-800">{formatDateTime(tx.createdAt)}</p>
                      {tx.paidAt && (
                        <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                          {t('paidAt', { date: formatDateTime(tx.paidAt) })}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <FilterX className="h-9 w-9 text-slate-300 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-slate-700">
                          {t('noTransactionsFound')}
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {t('noTransactionsHelp')}
                        </p>
                        {activeFiltersCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetAllFilters}
                            className="mt-3 text-xs border-slate-200 hover:bg-slate-50 gap-1.5 cursor-pointer rounded-lg"
                          >
                            <RotateCcw className="h-3 w-3" />
                            {t('clearAllFilters', { count: activeFiltersCount })}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemName={t('itemName')}
          />
        </div>
      )}
    </div>
  );
}
