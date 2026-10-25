'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminOverviewAction } from '@/features/admin/actions/admin-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Flag,
  Store,
  DollarSign,
  ArrowRight,
  Loader2,
  CreditCard,
  ListChecks,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Landmark,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { TransactionStatus } from '@/domain/entities';

interface RecentTransaction {
  id: string;
  transactionCode: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  provider: string;
  createdAt: string | Date;
  customerName: string;
  customerEmail: string;
}

interface MonthlyRevenueItem {
  month: string;
  fullMonthName: string;
  amount: number;
  count: number;
  height: string;
  isCurrent?: boolean;
}

interface OverviewData {
  totalUsers: number;
  activeCampaigns: number;
  totalBooths: number;
  totalRevenue: number;
  recentTransactions?: RecentTransaction[];
  planDistribution?: {
    free: number;
    starter: number;
    pro: number;
  };
  monthlyRevenue?: MonthlyRevenueItem[];
  revenueGrowthRate?: number;
  currentMonthLabel?: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminOverviewAction()
      .then((res) => setData(res as OverviewData))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Đang tải bảng điều khiển quản trị viên...</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Tổng Doanh Thu PayOS',
      value: `${data.totalRevenue.toLocaleString('vi-VN')} đ`,
      desc: 'Doanh thu từ các gói Starter & Pro',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: `${(data.revenueGrowthRate || 0) >= 0 ? '+' : ''}${data.revenueGrowthRate || 0}%`,
      badgeColor: (data.revenueGrowthRate || 0) >= 0
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      label: 'Tổng Người Dùng',
      value: data.totalUsers.toString(),
      desc: 'Tài khoản đăng nhập Google',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Đang hoạt động',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: 'Chiến Dịch Đang Chạy',
      value: data.activeCampaigns.toString(),
      desc: 'Trạng thái ACTIVE trên toàn sàn',
      icon: Flag,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: 'Theo dõi GPS',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      label: 'Tổng Số Gian Hàng',
      value: data.totalBooths.toString(),
      desc: 'Booths tại các địa điểm kích hoạt',
      icon: Store,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: `${data.totalBooths} booth`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  // Real 6-month revenue trend from database
  const monthlyRevenue = data.monthlyRevenue || [];

  const planDist = data.planDistribution || { free: 0, starter: 0, pro: 0 };
  const totalSubCount = planDist.free + planDist.starter + planDist.pro;
  const freePct = totalSubCount > 0 ? Math.round((planDist.free / totalSubCount) * 100) : 0;
  const starterPct = totalSubCount > 0 ? Math.round((planDist.starter / totalSubCount) * 100) : 0;
  const proPct = totalSubCount > 0 ? Math.round((planDist.pro / totalSubCount) * 100) : 0;

  const getTxnStatusBadge = (status: string) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] font-medium">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Thành công
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[11px] font-medium">
            <Clock className="h-3 w-3 text-amber-600" />
            Chờ thanh toán
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-[11px] font-medium">
            <XCircle className="h-3 w-3 text-rose-600" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Bảng Điều Hành Trung Tâm (SaaS Overview)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tổng quan biến động doanh thu VietQR, hiện trạng chiến dịch và hoạt động thuê bao toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/transactions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>Đối soát VietQR</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">{kpi.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{kpi.desc}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.color} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Grid: Revenue Trend & Plan Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Revenue Trend Chart */}
        <Card className="lg:col-span-7 border-slate-200 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Xu Hướng Tăng Trưởng Doanh Thu (6 Tháng)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Thống kê các đơn hàng nâng cấp gói dịch vụ thanh toán qua VietQR PayOS
              </CardDescription>
            </div>
            <Badge
              className={cn(
                'font-semibold text-xs',
                (data.revenueGrowthRate || 0) > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : (data.revenueGrowthRate || 0) < 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              )}
            >
              {(data.revenueGrowthRate || 0) > 0 ? `+${data.revenueGrowthRate}%` : `${data.revenueGrowthRate || 0}%`} so với tháng trước
            </Badge>
          </CardHeader>
          <CardContent className="pt-6 pb-5">
            <div className="h-56 flex items-end justify-between gap-3 px-2 pt-4">
              {monthlyRevenue.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.amount > 0 ? (item.amount >= 1000000 ? `${(item.amount / 1000000).toFixed(1)}M` : `${(item.amount / 1000).toFixed(0)}K`) : '0 đ'}
                  </div>
                  <div
                    className={cn(
                      'w-full max-w-[42px] rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-xs',
                      item.amount > 0
                        ? item.isCurrent
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500'
                          : 'bg-slate-300 hover:bg-slate-400'
                        : 'bg-slate-100 hover:bg-slate-200'
                    )}
                    style={{ height: item.height }}
                    title={`${item.fullMonthName}: ${item.amount.toLocaleString('vi-VN')} đ (${item.count} giao dịch)`}
                  />
                  <span className={cn('text-xs font-semibold', item.isCurrent ? 'text-blue-700 font-bold' : 'text-slate-500')}>
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
                Tháng hiện tại ({data.currentMonthLabel || 'Tháng này'})
              </span>
              <span>Tổng doanh thu lũy kế: <strong className="text-slate-900">{data.totalRevenue.toLocaleString('vi-VN')} đ</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Right (5 cols): Plan Distribution & Quota Stats */}
        <Card className="lg:col-span-5 border-slate-200 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Tỷ Lệ Phân Bổ Gói Dịch Vụ
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Cơ cấu khách hàng theo các gói Free, Starter và Pro
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-5 space-y-5">
            {/* Pro Plan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600 inline-block" />
                  Gói Pro (20 slots)
                </span>
                <span className="font-bold text-slate-900">{planDist.pro} khách hàng ({proPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${proPct}%` }} />
              </div>
            </div>

            {/* Starter Plan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
                  Gói Starter (5 slots)
                </span>
                <span className="font-bold text-slate-900">{planDist.starter} khách hàng ({starterPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${starterPct}%` }} />
              </div>
            </div>

            {/* Free Plan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400 inline-block" />
                  Gói Free (2 slots)
                </span>
                <span className="font-bold text-slate-900">{planDist.free} khách hàng ({freePct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${freePct}%` }} />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/admin/subscriptions"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Xem chi tiết danh sách đăng ký</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Recent Activity & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Recent Transactions Feed */}
        <Card className="lg:col-span-7 border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Giao Dịch PayOS Gần Nhất
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Các giao dịch chuyển khoản VietQR gần đây cần đối soát
              </CardDescription>
            </div>
            <Link
              href="/admin/transactions"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{tx.transactionCode}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {tx.plan}
                        </span>
                      </div>
                      <p className="text-slate-500 truncate mt-0.5 font-medium">
                        {tx.customerName} {tx.customerEmail ? `(${tx.customerEmail})` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {tx.amount.toLocaleString('vi-VN')} đ
                      </p>
                      <div className="mt-1">{getTxnStatusBadge(tx.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có dữ liệu giao dịch gần đây.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right (5 cols): Quick Operational Center */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Phím Tắt Điều Hành Hệ Thống
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
            <Link href="/admin/subscriptions" className="group">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Quản Lý Gói Người Dùng</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Đổi gói thủ công hoặc gia hạn hàng loạt</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </div>
            </Link>

            <Link href="/admin/templates" className="group">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Thư Viện Mẫu Checklist</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tiêu chuẩn nghiệm thu FMCG, Roadshow</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors shrink-0" />
              </div>
            </Link>

            <Link href="/admin/payment-settings" className="group">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Cấu Hình Nhận Tiền PayOS</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Thông tin tài khoản ngân hàng & VietQR API</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
