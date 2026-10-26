'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionPlanTier } from '@/domain/enums';
import { PLAN_CONFIGS } from '@/domain/entities';
import { checkSubscriptionPaymentStatusAction } from '../actions/subscription-actions';
import {
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Loader2,
  ExternalLink,
  Building2,
  User,
  Hash,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  Info,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface PayOSCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlanTier;
  planName?: string;
  qrCodeUrl: string;
  orderCode: number;
  amount: number;
  transactionCode: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  bin?: string;
  checkoutUrl?: string;
  description?: string;
  onSuccess: () => void;
}

export function PayOSCheckoutModal({
  isOpen,
  onClose,
  targetPlan,
  planName,
  qrCodeUrl,
  orderCode,
  amount,
  transactionCode,
  accountNumber = '011120057777',
  accountName = 'NGUYEN THANH TUNG',
  bankName = 'MB Bank (Ngân hàng TMCP Quân Đội)',
  checkoutUrl,
  description,
  onSuccess,
}: PayOSCheckoutModalProps) {
  const t = useTranslations('billing.payosModal');
  const tBilling = useTranslations('billing');
  const locale = useLocale();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [manualCheckMsg, setManualCheckMsg] = useState<string | null>(null);

  const displayName = planName || (targetPlan ? tBilling(`tiers.${targetPlan}.name`) : 'Gói Dịch Vụ');
  const transferContent = description || `EVENTGO ${orderCode}`;

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Polling transaction status with PayOS / Database
  useEffect(() => {
    if (!isOpen || isSuccess) return;

    let isCancelled = false;

    const pollStatus = async () => {
      try {
        const res = await checkSubscriptionPaymentStatusAction(orderCode, transactionCode);
        if (!isCancelled && res.isPaid) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    };

    // Run poll every 2.5s
    const interval = setInterval(pollStatus, 2500);
    // Also poll immediately on mount
    pollStatus();

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, isSuccess, orderCode, transactionCode, onSuccess, onClose]);

  const handleManualCheck = async () => {
    setIsCheckingManual(true);
    setManualCheckMsg(null);
    try {
      const res = await checkSubscriptionPaymentStatusAction(orderCode, transactionCode);
      if (res.isPaid) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setManualCheckMsg(t('manualCheckMsg'));
      }
    } catch (err: any) {
      setManualCheckMsg(err.message || 'Lỗi kiểm tra trạng thái thanh toán.');
    } finally {
      setIsCheckingManual(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleCopy = (key: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-6 bg-white rounded-2xl shadow-2xl border-slate-200 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center pb-1">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            {t('title', { plan: displayName })}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-500">
            {t('subtitle')}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('successTitle')}</h3>
            <p className="text-sm text-slate-600 max-w-sm">
              {t('successDesc', { plan: displayName })}
            </p>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
              {t('reloading')}
            </Badge>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Amount & Time banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  {t('amountLabel')}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-blue-700">
                    {amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} đ
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy('amount', amount.toString())}
                    className="text-blue-500 hover:text-blue-700 p-1 cursor-pointer"
                    title={t('copyAmountTitle')}
                  >
                    {copiedKey === 'amount' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 gap-1 text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </Badge>
                <p className="text-[11px] text-slate-500 mt-1">{t('qrExpiresLabel')}</p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="VietQR PayOS MB Bank"
                  className="w-52 h-52 object-contain rounded-lg"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-3 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{t('qrSecurity')}</span>
              </div>
            </div>

            {/* Beneficiary Bank Account Details Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {t('manualCardTitle')}
                </span>
                <span className="text-[11px] font-normal text-slate-500">{t('napasBadge')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t('bankLabel')}</span>
                <span className="font-semibold text-slate-800">{bankName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {t('accountNameLabel')}
                </span>
                <span className="font-semibold text-slate-900">{accountName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  {t('accountNoLabel')}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('stk', accountNumber)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium cursor-pointer"
                    title={t('copyAccTitle')}
                  >
                    {copiedKey === 'stk' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedKey === 'stk' ? t('copied') : t('copy')}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-blue-50/70 p-2.5 rounded-lg border border-blue-200/60">
                <span className="text-blue-900 font-semibold">{t('transferContentLabel')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-700">
                    {transferContent}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('content', transferContent)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold cursor-pointer"
                    title={t('copyContentTitle')}
                  >
                    {copiedKey === 'content' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedKey === 'content' ? t('copied') : t('copy')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SLA Commitment and Manual Check Action */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 space-y-2">
              <div className="flex items-start gap-2 text-xs text-blue-900 leading-relaxed">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{t('slaTitle')}</strong> {t('slaDesc')}
                </span>
              </div>

              {manualCheckMsg && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-in fade-in">
                  {manualCheckMsg}
                </div>
              )}

              <Button
                type="button"
                onClick={handleManualCheck}
                disabled={isCheckingManual}
                className="w-full text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs cursor-pointer"
              >
                {isCheckingManual ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {t('btnManualCheck')}
              </Button>
            </div>

            {/* Realtime listener status indicator */}
            <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span>{t('listening')}</span>
            </div>

            {/* Action buttons & Hotline */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              {checkoutUrl && checkoutUrl.startsWith('http') ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('openPortal')}
                </a>
              ) : (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <PhoneCall className="h-3 w-3 text-emerald-600" />
                  {t('hotline')}
                </span>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {t('btnClose')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
