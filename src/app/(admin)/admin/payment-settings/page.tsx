'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, Copy, Check, Loader2 } from 'lucide-react';
import { getPaymentGatewayConfigAction } from '@/features/admin/actions/admin-actions';

interface PaymentConfigData {
  beneficiaryBank: {
    bankName: string;
    bankBin: string;
    accountNumber: string;
    accountName: string;
    transferSyntaxPrefix: string;
  };
  payos: {
    isConfigured: boolean;
    gatewayName: string;
    webhookUrl: string;
  };
}

export default function AdminPaymentSettingsPage() {
  const [data, setData] = useState<PaymentConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await getPaymentGatewayConfigAction();
        setData(res);
      } catch (err) {
        console.error('Failed to load payment gateway config:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const bank = data?.beneficiaryBank || {
    bankName: 'MB Bank (Ngân hàng TMCP Quân Đội)',
    bankBin: '970422',
    accountNumber: '011120057777',
    accountName: 'NGUYEN THANH TUNG',
    transferSyntaxPrefix: 'EVENTGO',
  };

  const payos = data?.payos || {
    isConfigured: true,
    gatewayName: 'PayOS (VietQR Napas 24/7)',
    webhookUrl: '/api/webhooks/payos',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-blue-600" />
          Cấu hình nhận tiền
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Thông tin tài khoản thụ hưởng và cổng thanh toán tự động (Chế độ xem)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Phần 1: Tài khoản ngân hàng thụ hưởng */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Tài khoản ngân hàng thụ hưởng</h2>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Ngân hàng</span>
              <span className="font-medium text-slate-900">{bank.bankName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{bank.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(bank.accountNumber, 'acc')}
                  className="p-1 text-slate-400 hover:text-blue-600"
                  title="Sao chép"
                >
                  {copiedKey === 'acc' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Chủ tài khoản</span>
              <span className="font-mono font-medium text-slate-900 uppercase">{bank.accountName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Cú pháp chuyển khoản</span>
              <span className="font-mono font-medium text-blue-600">{bank.transferSyntaxPrefix} [PLAN]</span>
            </div>
          </div>
        </div>

        {/* Phần 2: Cổng thanh toán */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Cổng thanh toán tự động</h2>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Cổng thanh toán</span>
              <span className="font-medium text-slate-900">{payos.gatewayName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Trạng thái kết nối</span>
              <span className="font-medium text-emerald-600">
                {payos.isConfigured ? '● Đang hoạt động' : '○ Chưa kết nối'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Webhook đối soát</span>
              <span className="font-mono text-slate-700">{payos.webhookUrl}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
