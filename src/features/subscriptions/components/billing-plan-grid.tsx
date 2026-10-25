'use client';

import React from 'react';
import { SubscriptionPlanTier, PlanConfig, PLAN_CONFIGS } from '@/domain/entities';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingPlanGridProps {
  planConfigs: PlanConfig[];
  currentTier: SubscriptionPlanTier;
  isCurrentSubActive: boolean;
  onSelectPlan: (targetPlan: SubscriptionPlanTier, planName: string, price: number) => void;
}

const PLAN_TIER_LEVEL: Record<SubscriptionPlanTier, number> = {
  [SubscriptionPlanTier.FREE]: 0,
  [SubscriptionPlanTier.STARTER]: 1,
  [SubscriptionPlanTier.PRO]: 2,
};

export function BillingPlanGrid({
  planConfigs,
  currentTier,
  isCurrentSubActive,
  onSelectPlan,
}: BillingPlanGridProps) {
  const currentTierLevel = isCurrentSubActive ? PLAN_TIER_LEVEL[currentTier] : 0;

  const tiers = [
    SubscriptionPlanTier.FREE,
    SubscriptionPlanTier.STARTER,
    SubscriptionPlanTier.PRO,
  ];

  return (
    <div className="space-y-4">
      <div className="text-center max-w-xl mx-auto space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Chọn Gói Cước Phù Hợp Cho Doanh Nghiệp
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Nâng cấp hoặc gia hạn linh hoạt theo tháng với cổng thanh toán PayOS VietQR tự động.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-2">
        {tiers.map((tier) => {
          const config =
            planConfigs.find((p) => p.tier === tier) || PLAN_CONFIGS[tier];
          const isCurrent = currentTier === tier;
          const tierLevel = PLAN_TIER_LEVEL[tier];
          const isHigher = tierLevel > currentTierLevel;
          const isLower = isCurrentSubActive && tierLevel < currentTierLevel;
          const isPro = tier === SubscriptionPlanTier.PRO;

          return (
            <Card
              key={tier}
              className={cn(
                'relative flex flex-col justify-between rounded-2xl transition-all duration-200',
                isPro
                  ? 'border-2 border-blue-600 shadow-lg shadow-blue-500/10'
                  : 'border border-slate-200 hover:border-slate-300 shadow-xs',
                isCurrent && 'ring-2 ring-blue-500/20'
              )}
            >
              {/* Popular Badge */}
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-bold text-[10px] tracking-wider uppercase px-3 py-1 shadow-sm">
                    Phổ biến nhất
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {config.name}
                  </CardTitle>
                  {isCurrent && (
                    <Badge variant="outline" className="text-xs border-blue-300 bg-blue-50 text-blue-700 font-semibold">
                      Gói hiện tại
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500 min-h-[32px] mt-1">
                  {config.description}
                </CardDescription>

                {/* Price Display */}
                <div className="pt-3">
                  {config.priceMonthlyVnd > 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {config.priceMonthlyVnd.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">đ / tháng</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        0 đ
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Miễn phí</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Features List */}
              <CardContent className="flex-1 pb-6 space-y-3">
                <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-slate-800">
                  Hạn mức & Tính năng:
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Tối đa <strong>{config.maxActiveCampaigns} chiến dịch</strong> chạy đồng thời
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Không giới hạn số gian hàng (booths)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Nghiệm thu ảnh có tọa độ GPS & Timestamp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Phê duyệt bằng chứng hiện trường 2 bước</span>
                  </li>
                  {isPro && (
                    <li className="flex items-center gap-2 text-blue-700 font-semibold">
                      <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Hỗ trợ kỹ thuật ưu tiên 24/7 & SLA 99.9%</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              {/* Action Button */}
              <CardFooter className="pt-2">
                {tier === SubscriptionPlanTier.FREE ? (
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold h-10 border-slate-200 text-slate-600"
                    disabled
                  >
                    {isCurrent ? 'Đang sử dụng' : 'Gói mặc định'}
                  </Button>
                ) : isLower ? (
                  <Button
                    variant="outline"
                    className="w-full text-xs font-medium h-10 border-slate-200 text-slate-400 cursor-not-allowed"
                    disabled
                    title="Bạn đang sử dụng gói cao hơn"
                  >
                    Gói thấp hơn
                  </Button>
                ) : isCurrent ? (
                  <Button
                    onClick={() => onSelectPlan(tier, config.name, config.priceMonthlyVnd)}
                    className="w-full text-xs font-semibold h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                  >
                    Gia hạn thêm 30 ngày
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSelectPlan(tier, config.name, config.priceMonthlyVnd)}
                    className={cn(
                      'w-full text-xs font-semibold h-10 transition-all cursor-pointer shadow-xs',
                      isPro
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    )}
                  >
                    <span>{isHigher ? `Nâng cấp lên ${config.name}` : `Đăng ký ${config.name}`}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
