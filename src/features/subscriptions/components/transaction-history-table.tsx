'use client';

import React from 'react';
import { Transaction, TransactionStatus } from '@/domain/entities';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { CreditCard, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface TransactionHistoryTableProps {
  transactions: Transaction[];
}

export function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6">
        <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">Chưa có lịch sử giao dịch nào</p>
        <p className="text-xs text-slate-400 mt-1">Các giao dịch thanh toán nâng gói sẽ được lưu lại tại đây.</p>
      </div>
    );
  }

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
            Thất bại
          </Badge>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
              <th className="py-3 px-4">Mã đơn</th>
              <th className="py-3 px-4">Gói dịch vụ</th>
              <th className="py-3 px-4">Số tiền</th>
              <th className="py-3 px-4">Cổng</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-slate-800">
                  {t.transactionCode}
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-blue-600">
                    {t.plan}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  {t.amount.toLocaleString('vi-VN')} {t.currency}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {t.provider === 'PAYOS_VIETQR' ? 'VietQR (PayOS)' : 'Chuyển khoản'}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(t.status)}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {formatDate(t.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
