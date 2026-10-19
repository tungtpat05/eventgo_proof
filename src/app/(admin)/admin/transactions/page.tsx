'use client';

import React, { useState, useEffect, useTransition } from 'react';
import * as XLSX from 'xlsx';
import {
  getAdminTransactionsAction,
  manualApproveTransactionAction,
  refundTransactionAction,
} from '@/features/admin/actions/admin-actions';
import { Transaction, TransactionStatus } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ExtendedTransaction extends Transaction {
  userFullName: string;
  userEmail: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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

  const handleApprove = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xác nhận đã nhận tiền cho đơn hàng này?')) return;
    startTransition(async () => {
      try {
        await manualApproveTransactionAction(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi duyệt đơn');
      }
    });
  };

  const handleRefund = (id: string) => {
    if (!confirm('Bạn có chắc muốn hoàn tiền đơn này? Gói của người dùng sẽ bị hạ về Free.')) return;
    startTransition(async () => {
      try {
        await refundTransactionAction(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi hoàn tiền');
      }
    });
  };

  const handleExportExcel = () => {
    const data = transactions.map((t, idx) => ({
      STT: idx + 1,
      'Mã Đơn': t.transactionCode,
      'Khách Hàng': t.userFullName,
      Email: t.userEmail,
      'Gói Mua': t.plan,
      'Số Tiền (VND)': t.amount,
      'Phương Thức': t.provider,
      'Trạng Thái': t.status,
      'Ngày Tạo': formatDate(t.createdAt),
      'Ngày Thanh Toán': t.paidAt ? formatDate(t.paidAt) : 'Chưa thanh toán',
      'Ghi Chú': t.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Giao_Dich');
    XLSX.writeFile(wb, `EventGo_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.transactionCode.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.userFullName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
            Đối soát các khoản thanh toán VietQR PayOS và phê duyệt thanh toán thủ công
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs gap-1.5 border-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Làm mới
          </Button>

          <Button
            size="sm"
            onClick={handleExportExcel}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: TransactionStatus.PENDING, label: 'Chờ thanh toán' },
            { key: TransactionStatus.SUCCESS, label: 'Thành công' },
            { key: TransactionStatus.REFUNDED, label: 'Đã hoàn tiền' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
          Không tìm thấy giao dịch nào phù hợp
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Gói & Số tiền</th>
                  <th className="py-3 px-4">Cổng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
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
                      <p>{formatDate(t.createdAt)}</p>
                      {t.paidAt && (
                        <p className="text-[11px] text-emerald-600">Đã trả: {formatDate(t.paidAt)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.status === TransactionStatus.PENDING && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(t.id)}
                          disabled={isPending}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                        >
                          Duyệt thanh toán
                        </Button>
                      )}
                      {t.status === TransactionStatus.SUCCESS && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(t.id)}
                          disabled={isPending}
                          className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-8"
                        >
                          Hoàn tiền
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
