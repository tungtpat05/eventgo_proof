'use client';

import React from 'react';
import { UserSubscriptionSummary } from '../actions/subscription-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Clock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingQuotaCardProps {
  summary: UserSubscriptionSummary;
}

export function BillingQuotaCard({ summary }: BillingQuotaCardProps) {
  const activeCount = summary.activeCampaignCount;
  const maxAllowed = summary.planConfig.maxActiveCampaigns;
  const percentUsed = Math.min(100, Math.round((activeCount / maxAllowed) * 100));

  const isExpiringSoon = summary.isExpiringSoon;
  const isExpired = summary.isExpired;

  return (
    <Card className="border-blue-200/80 bg-gradient-to-r from-blue-50/60 via-white to-white shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-blue-100/60 bg-blue-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Gói Thuê Bao Hiện Tại
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                {summary.planConfig.name}
              </CardTitle>
              {isExpired ? (
                <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-xs font-semibold">
                  <AlertTriangle className="h-3 w-3 text-rose-600" />
                  Đã hết hạn
                </Badge>
              ) : isExpiringSoon ? (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs font-semibold">
                  <Clock className="h-3 w-3 text-amber-600" />
                  Sắp hết hạn
                </Badge>
              ) : (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs font-semibold">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Đang hoạt động
                </Badge>
              )}
            </div>
          </div>

          {/* Expiration date */}
          <div className="text-left sm:text-right">
            {summary.subscription?.expiresAt ? (
              <div>
                <p className="text-xs text-slate-500">Hết hạn vào</p>
                <p className="text-sm font-bold text-slate-800">
                  {new Date(summary.subscription.expiresAt).toLocaleDateString('vi-VN')}
                  {summary.daysRemaining !== null && (
                    <span
                      className={cn(
                        'ml-2 text-xs font-semibold px-2 py-0.5 rounded-full inline-block',
                        summary.daysRemaining <= 3
                          ? 'bg-rose-100 text-rose-700'
                          : summary.daysRemaining <= 7
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      (Còn {summary.daysRemaining} ngày)
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500">Thời hạn sử dụng</p>
                <p className="text-sm font-bold text-slate-800">Gói Miễn phí vĩnh viễn</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 pb-6">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Active Campaigns Usage Gauge */}
          <div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                Chiến dịch đang kích hoạt
              </span>
              <span>
                <strong className="text-slate-900 text-base">{activeCount}</strong> / {maxAllowed} slots
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  percentUsed >= 100
                    ? 'bg-rose-500'
                    : percentUsed >= 80
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                )}
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-2">
              {percentUsed >= 100
                ? 'Bạn đã dùng hết hạn mức chiến dịch. Hãy nâng cấp gói để tạo thêm chiến dịch mới.'
                : `Bạn còn ${maxAllowed - activeCount} vị trí chiến dịch có thể chạy đồng thời.`}
            </p>
          </div>

          {/* Features in current plan */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 text-xs space-y-1.5">
            <span className="font-bold text-slate-800 block text-xs mb-1">
              Quyền lợi gói {summary.planConfig.name}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
              <span>• Tối đa {maxAllowed} chiến dịch đồng thời</span>
              <span>• Không giới hạn số booth</span>
              <span>• Định vị GPS & Timestamp chuẩn</span>
              <span>• Xuất báo cáo Excel / PDF</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
