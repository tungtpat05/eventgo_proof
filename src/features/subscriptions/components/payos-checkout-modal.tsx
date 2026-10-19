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
import { simulatePaymentSuccessAction } from '../actions/subscription-actions';
import { QrCode, CheckCircle2, Copy, Check, Clock, Loader2, Sparkles } from 'lucide-react';

interface PayOSCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlanTier;
  qrCodeUrl: string;
  orderCode: number;
  amount: number;
  transactionCode: string;
  onSuccess: () => void;
}

export function PayOSCheckoutModal({
  isOpen,
  onClose,
  targetPlan,
  qrCodeUrl,
  orderCode,
  amount,
  transactionCode,
  onSuccess,
}: PayOSCheckoutModalProps) {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  const planConfig = PLAN_CONFIGS[targetPlan];

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`EVENTGO ${orderCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      await simulatePaymentSuccessAction(transactionCode);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Lỗi giả lập thanh toán');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl shadow-2xl border-slate-200">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            Thanh toán {planConfig.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ để tự động nâng gói
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Thanh toán thành công!</h3>
            <p className="text-sm text-slate-600">
              Gói <span className="font-semibold text-blue-600">{planConfig.name}</span> của bạn đã được kích hoạt thành công trong 30 ngày.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Amount & Time banner */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Số tiền thanh toán</p>
                <p className="text-xl font-bold text-blue-700">
                  {amount.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 gap-1 text-xs">
                  <Clock className="h-3 w-3 text-amber-500" />
                  {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </Badge>
                <p className="text-[11px] text-slate-500 mt-1">Hết hạn sau</p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="VietQR PayOS"
                  className="w-48 h-48 object-contain"
                />
              </div>

              {/* Order code & copy */}
              <div className="mt-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                <span>Nội dung: <strong>EVENTGO {orderCode}</strong></span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-blue-600 hover:text-blue-700 font-medium ml-1 flex items-center gap-0.5"
                  title="Sao chép cú pháp"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Chép'}</span>
                </button>
              </div>
            </div>

            {/* Realtime listener status */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản...</span>
            </div>

            {/* Testing / Sandbox Simulation Button */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full text-xs gap-1.5 border-dashed border-blue-400 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60"
              >
                {isSimulating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                )}
                <span>[Test / Demo] Giả lập quét chuyển khoản thành công</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Đóng / Thanh toán sau
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
