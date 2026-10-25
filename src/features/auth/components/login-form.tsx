'use client';

import React from 'react';
import Link from 'next/link';
import { signInWithGoogleAction } from '../actions/auth-actions';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  CheckCircle,
  MapPin,
  Clock,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface LoginFormProps {
  error?: string;
}

// Official Google Multicolored SVG Logo (Google Brand Identity Guidelines)
function GoogleColorIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.64-5.2 3.64-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.92H1.21v3.15C3.25 21.43 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.32 14.28c-.24-.72-.37-1.49-.37-2.28s.13-1.56.37-2.28V6.57H1.21C.44 8.11 0 9.99 0 12s.44 3.89 1.21 5.43l4.11-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.57 1.21 6.57l4.11 3.15c.94-2.82 3.58-4.97 6.68-4.97z"
      />
    </svg>
  );
}

export function LoginForm({ error }: LoginFormProps) {
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-12 bg-white">
      {/* LEFT COLUMN: Modern SaaS Login Form */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-white min-h-screen">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 leading-none block">
              EventGo Proof
            </span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5 block">
              Nền tảng Nghiệm thu Gian hàng
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="my-auto py-10 max-w-sm w-full mx-auto">
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Đăng nhập hệ thống
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Truy cập không gian làm việc để quản lý chiến dịch, giám sát tiến độ booth và duyệt bằng chứng hiện trường.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-800 text-[11px] font-bold">
                !
              </span>
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Google Sign In Form */}
          <form action={signInWithGoogleAction} className="space-y-4">
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/90 text-slate-800 font-semibold text-sm shadow-xs hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.99] cursor-pointer"
            >
              <GoogleColorIcon className="h-5 w-5 shrink-0" />
              <span>Đăng nhập bằng Google</span>
            </button>
          </form>

          {/* Security & Access Reassurance */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Xác thực OAuth 2.0 an toàn qua Google Workspace</span>
            </div>
          </div>
        </div>

        {/* Footer Legal Links */}
        <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <span className="text-slate-600 font-medium">Điều khoản Dịch vụ</span> và{' '}
            <span className="text-slate-600 font-medium">Chính sách Bảo mật</span> của EventGo.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: High-Converting Branded Hero Banner */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 bg-slate-900 text-white flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-blue-400 text-xs font-semibold backdrop-blur-xs">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>SAAS ACTIVATION & BOOTH COMPLIANCE</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Phiên bản v1.0</span>
        </div>

        {/* Center Value Proposition */}
        <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Nền tảng số hóa nghiệm thu hiện trường minh bạch & chuẩn xác
          </h2>
          <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
            Giải quyết triệt để rủi ro gian lận thi công, thất lạc bằng chứng và chậm trễ tiến độ thanh toán cho các chiến dịch Brand Activation toàn quốc.
          </p>

          {/* 3 Pillar Feature Cards */}
          <div className="grid gap-3.5 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
              <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">
                  Định vị GPS & Thời gian thực
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Ảnh nghiệm thu được gắn tọa độ vị trí và timestamp không thể can thiệp, chống báo cáo khống.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">
                  Checklist Tiêu chuẩn Đa ngành
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Thư viện mẫu kiểm duyệt booth chuẩn hóa theo ngành hàng FMCG, Điện tử tiêu dùng, Ô tô xe máy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
              <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">
                  Thanh toán PayOS VietQR Tự động
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Kích hoạt và gia hạn gói dịch vụ tức thì qua cổng VietQR, hạn ngạch cập nhật theo giây.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Capabilities */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4">
          <div>
            <div className="text-base xl:text-lg font-bold text-white tracking-tight">Real-time</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tọa độ GPS & Timestamp</div>
          </div>
          <div>
            <div className="text-base xl:text-lg font-bold text-white tracking-tight">Đa Điểm Cầu</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Chiến dịch phân tán</div>
          </div>
          <div>
            <div className="text-base xl:text-lg font-bold text-white tracking-tight">Tự Động Hóa</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Thanh toán VietQR 24/7</div>
          </div>
        </div>
      </div>
    </div>
  );
}
