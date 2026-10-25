'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ShieldCheck } from 'lucide-react';

export default function ErrorBoundaryPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error caught by root boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6">
        {/* Brand Warning Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider">
            Sự cố hệ thống
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đã xảy ra lỗi tải trang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Hệ thống gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng bấm thử lại hoặc quay về trang chủ.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto text-xs font-semibold h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Thử tải lại trang</span>
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold h-10 px-5 border-slate-200 text-slate-700 cursor-pointer">
              <Home className="h-4 w-4 mr-1.5" />
              <span>Về Bảng điều khiển</span>
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-8">
        EventGo Proof — Nền tảng Nghiệm thu Gian hàng & Kích hoạt Thương hiệu
      </p>
    </div>
  );
}
