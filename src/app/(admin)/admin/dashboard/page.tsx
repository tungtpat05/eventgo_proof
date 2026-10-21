'use client';

import React, { useState, useEffect } from 'react';
import { getAdminOverviewAction } from '@/features/admin/actions/admin-actions';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  Users,
  Flag,
  Store,
  DollarSign,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CreditCard,
  ListChecks,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeCampaigns: number;
    totalBooths: number;
    totalRevenue: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminOverviewAction()
      .then(setStats)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Đang tải bảng điều khiển quản trị viên...</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Tổng Doanh Thu',
      value: `${stats.totalRevenue.toLocaleString('vi-VN')} đ`,
      desc: 'Doanh thu từ các gói Starter & Pro',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Tổng Người Dùng',
      value: stats.totalUsers.toString(),
      desc: 'Tài khoản đăng nhập Google',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      label: 'Chiến Dịch Đang Chạy',
      value: stats.activeCampaigns.toString(),
      desc: 'Trạng thái ACTIVE trên toàn sàn',
      icon: Flag,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Tổng Số Gian Hàng',
      value: stats.totalBooths.toString(),
      desc: 'Booths tại các địa điểm kích hoạt',
      icon: Store,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          Bảng Điều Khiển Quản Trị Hệ Thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi tổng quan chỉ số vận hành, dòng tiền giao dịch và hạn mức thuê bao
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border-slate-200 shadow-sm bg-white hover:shadow transition-shadow">
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpi.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{kpi.desc}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/subscriptions" className="group">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
              Quản lý Gói Người Dùng
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Xem danh sách khách hàng, đổi gói Free/Starter/Pro hoặc gia hạn thủ công.
            </p>
          </div>
        </Link>

        <Link href="/admin/transactions" className="group">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
              Đối Soát & Giao Dịch
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Theo dõi lịch sử đơn hàng PayOS VietQR, đối soát tự động và xuất Excel.
            </p>
          </div>
        </Link>

        <Link href="/admin/templates" className="group">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ListChecks className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
              Thư Viện Mẫu Checklist
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Tạo bộ tiêu chuẩn kiểm tra ngành (Siêu thị, Roadshow, TTTM) cho Wizard Bước 3.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
