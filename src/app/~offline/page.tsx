'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">
            Mất kết nối mạng
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Hiện tại thiết bị của bạn không có kết nối Internet hoặc tín hiệu mạng quá yếu. Vui lòng kiểm tra lại Wifi/4G để tiếp tục thao tác.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 h-11"
          >
            <RefreshCw className="w-4 h-4" />
            Thử kết nối lại
          </Button>
        </div>

        <p className="text-xs text-slate-400">
          EventGo Proof — Nền tảng Nghiệm thu Gian hàng Sự kiện
        </p>
      </div>
    </div>
  );
}

