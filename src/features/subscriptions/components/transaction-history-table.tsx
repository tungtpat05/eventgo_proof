'use client';

import React from 'react';
import { Transaction, TransactionStatus } from '@/domain/entities';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { CreditCard, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface TransactionHistoryTableProps {
  transactions: Transaction[];
}

export function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  const t = useTranslations('billing.transactions');
  const locale = useLocale();

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6">
        <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">{t('empty')}</p>
        <p className="text-xs text-slate-500 mt-1">{t('emptyDesc')}</p>
      </div>
    );
  }

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {t('statusSuccess')}
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">
            <Clock className="h-3 w-3 text-amber-600" />
            {t('statusPending')}
          </Badge>
        );
      case TransactionStatus.CANCELLED:
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1 text-xs">
            <XCircle className="h-3 w-3 text-slate-500" />
            {t('statusCancelled')}
          </Badge>
        );
      case TransactionStatus.REFUNDED:
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 gap-1 text-xs">
            <AlertCircle className="h-3 w-3 text-purple-600" />
            {t('statusRefunded')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-xs">
            <XCircle className="h-3 w-3 text-rose-600" />
            {t('statusFailed')}
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
              <th className="py-3 px-4">{t('thOrderCode')}</th>
              <th className="py-3 px-4">{t('thPlan')}</th>
              <th className="py-3 px-4">{t('thAmount')}</th>
              <th className="py-3 px-4">{t('thGateway')}</th>
              <th className="py-3 px-4">{t('thStatus')}</th>
              <th className="py-3 px-4">{t('thTime')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-slate-800">
                  {txn.transactionCode}
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-blue-600">
                    {txn.plan}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  {txn.amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} {txn.currency}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {txn.provider === 'PAYOS_VIETQR' ? t('gatewayPayos') : t('gatewayTransfer')}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(txn.status)}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  <p className="font-medium text-slate-700">{formatDateTime(txn.createdAt, locale)}</p>
                  {txn.paidAt && (
                    <p className="text-[11px] text-emerald-600 font-medium">
                      {t('paidAt', { time: formatDateTime(txn.paidAt, locale) })}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
