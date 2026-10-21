'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUserSubscriptionSummaryAction,
  getSubscriptionPlanConfigsAction,
  createSubscriptionPaymentAction,
  getUserTransactionsAction,
  UserSubscriptionSummary,
} from '@/features/subscriptions/actions/subscription-actions';
import { TransactionHistoryTable } from '@/features/subscriptions/components/transaction-history-table';
import { PayOSCheckoutModal } from '@/features/subscriptions/components/payos-checkout-modal';
import { ExpirationWarningBanner } from '@/features/subscriptions/components/expiration-warning-banner';
import { SubscriptionPlanTier, Transaction, PLAN_CONFIGS, PlanConfig } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Info,
} from 'lucide-react';

export default function BillingPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<UserSubscriptionSummary | null>(null);
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal checkout state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
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
  } | null>(null);

  // Upgrade confirmation modal state
  const [upgradeConfirmData, setUpgradeConfirmData] = useState<{
    targetPlan: SubscriptionPlanTier;
    planName: string;
    price: number;
  } | null>(null);

  const loadData = async () => {
    try {
      const [sum, configs, txns] = await Promise.all([
        getUserSubscriptionSummaryAction(),
        getSubscriptionPlanConfigsAction(),
        getUserTransactionsAction(),
      ]);
      setSummary(sum);
      setPlanConfigs(configs);
      setTransactions(txns);
    } catch (err: any) {
      console.error('Failed to load billing summary:', err);
      // Graceful fallback to Free tier default
      setSummary({
        subscription: null,
        planConfig: PLAN_CONFIGS[SubscriptionPlanTier.FREE],
        activeCampaignCount: 0,
        remainingCampaignSlots: PLAN_CONFIGS[SubscriptionPlanTier.FREE].maxActiveCampaigns,
        daysRemaining: null,
        isExpiringSoon: false,
        isExpired: false,
        canCreateCampaign: true,
      });
      setPlanConfigs([
        PLAN_CONFIGS[SubscriptionPlanTier.FREE],
        PLAN_CONFIGS[SubscriptionPlanTier.STARTER],
        PLAN_CONFIGS[SubscriptionPlanTier.PRO],
      ]);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCheckout = (planTier: SubscriptionPlanTier, planName?: string) => {
    startTransition(async () => {
      try {
        const result = await createSubscriptionPaymentAction(planTier);
        setModalData({
          targetPlan: planTier,
          planName,
          qrCodeUrl: result.qrCode,
          orderCode: result.orderCode,
          amount: result.amount,
          transactionCode: result.transaction.transactionCode,
          accountNumber: result.accountNumber,
          accountName: result.accountName,
          bankName: result.bankName,
          bin: result.bin,
          checkoutUrl: result.checkoutUrl,
          description: result.description,
        });
        setIsModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Lỗi khởi tạo cổng thanh toán');
      }
    });
  };

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Đang tải thông tin gói dịch vụ & thanh toán...</p>
      </div>
    );
  }

  const currentTier = summary.subscription?.plan || SubscriptionPlanTier.FREE;
  const activeCount = summary.activeCampaignCount;
  const maxAllowed = summary.planConfig.maxActiveCampaigns;
  const percentUsed = Math.min(100, Math.round((activeCount / maxAllowed) * 100));

  const PLAN_TIER_LEVEL: Record<SubscriptionPlanTier, number> = {
    [SubscriptionPlanTier.FREE]: 0,
    [SubscriptionPlanTier.STARTER]: 1,
    [SubscriptionPlanTier.PRO]: 2,
  };

  const isCurrentSubActive = !!(
    summary.subscription &&
    summary.subscription.plan !== SubscriptionPlanTier.FREE &&
    summary.subscription.expiresAt &&
    !summary.isExpired &&
    (summary.daysRemaining === null || summary.daysRemaining > 0)
  );
  const currentTierLevel = isCurrentSubActive ? PLAN_TIER_LEVEL[currentTier] : 0;

  const handlePlanAction = (targetPlan: SubscriptionPlanTier, planName: string, price: number) => {
    const targetLevel = PLAN_TIER_LEVEL[targetPlan];

    // Case 1: Downgrade from active higher tier -> blocked
    if (isCurrentSubActive && targetLevel < currentTierLevel) {
      return;
    }

    // Case 2: Upgrade from active lower tier (e.g. Starter -> Pro) -> confirmation dialog
    if (isCurrentSubActive && targetLevel > currentTierLevel) {
      setUpgradeConfirmData({
        targetPlan,
        planName,
        price,
      });
      return;
    }

    // Case 3: Renewal (same tier) or purchase from Free/Expired
    handleOpenCheckout(targetPlan, planName);
  };

  const freeConfig =
    planConfigs.find((p) => p.tier === SubscriptionPlanTier.FREE) ||
    PLAN_CONFIGS[SubscriptionPlanTier.FREE];
  const starterConfig =
    planConfigs.find((p) => p.tier === SubscriptionPlanTier.STARTER) ||
    PLAN_CONFIGS[SubscriptionPlanTier.STARTER];
  const proConfig =
    planConfigs.find((p) => p.tier === SubscriptionPlanTier.PRO) ||
    PLAN_CONFIGS[SubscriptionPlanTier.PRO];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Expiration warning banner */}
      <ExpirationWarningBanner
        daysRemaining={summary.daysRemaining}
        isExpired={summary.isExpired}
        planName={summary.planConfig.name}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Gói Dịch Vụ & Thanh Toán
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý hạn mức chiến dịch, gia hạn thuê bao và đối soát lịch sử hóa đơn
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            loadData();
          }}
          className="gap-1.5 text-xs self-start sm:self-auto border-slate-300"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          Làm mới
        </Button>
      </div>

      {/* Block 1: Current Subscription Overview */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/70 via-white to-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-blue-100/60 bg-blue-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Gói Thuê Bao Hiện Tại
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                <CardTitle className="text-xl font-bold text-slate-900">
                  {summary.planConfig.name}
                </CardTitle>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Đang hoạt động
                </Badge>
              </div>
            </div>

            {currentTier !== SubscriptionPlanTier.FREE && (
              <Button
                size="sm"
                onClick={() => handleOpenCheckout(currentTier, summary.planConfig.name)}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Gia hạn (+30 ngày cộng dồn)
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {/* Column 1: Quota Progress */}
          <div className="space-y-2 md:border-r border-slate-100 md:pr-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Chiến dịch Active</span>
              <span className="font-bold text-slate-800">
                {activeCount} / {maxAllowed} ({summary.remainingCampaignSlots} slot trống)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  percentUsed >= 100
                    ? 'bg-amber-500'
                    : percentUsed >= 70
                    ? 'bg-blue-600'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Chỉ chiến dịch trạng thái <strong>ACTIVE</strong> mới tính vào hạn mức.
            </p>
          </div>

          {/* Column 2: Expiration */}
          <div className="space-y-1 md:border-r border-slate-100 md:pr-4">
            <span className="text-xs text-slate-500 font-medium">Thời hạn sử dụng</span>
            {summary.subscription?.expiresAt ? (
              <div>
                <p className="text-base font-bold text-slate-800">
                  {new Date(summary.subscription.expiresAt).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  Còn {summary.daysRemaining} ngày sử dụng
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base font-bold text-slate-800">Vĩnh viễn</p>
                <p className="text-xs text-slate-500">Gói Free không giới hạn thời gian</p>
              </div>
            )}
          </div>

          {/* Column 3: Features summary */}
          <div className="space-y-1 text-xs text-slate-600">
            <span className="text-slate-500 font-medium block">Đặc quyền theo gói</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Không giới hạn Booth / Chiến dịch</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Không giới hạn Người tham gia</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 2: Pricing Tiers Comparison */}
      <div>
        <div className="text-center sm:text-left mb-6">
          <h2 className="text-lg font-bold text-slate-900">Chọn Gói Dịch Vụ Phù Hợp</h2>
          <p className="text-sm text-slate-500">
            Nâng cấp dễ dàng qua mã VietQR tự động, kích hoạt ngay lập tức trong 3 giây
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TIER 1: FREE */}
          <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            currentTier === SubscriptionPlanTier.FREE
              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 text-lg">{freeConfig.name}</h3>
                {currentTier === SubscriptionPlanTier.FREE && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    Đang dùng
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">{freeConfig.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">
                  {freeConfig.priceMonthlyVnd === 0
                    ? '0 đ'
                    : `${freeConfig.priceMonthlyVnd.toLocaleString('vi-VN')} đ`}
                </span>
                <span className="text-xs text-slate-500 ml-1">/ vĩnh viễn</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4">
                {freeConfig.features && freeConfig.features.length > 0 ? (
                  freeConfig.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span><strong>{freeConfig.maxActiveCampaigns} Chiến dịch</strong> hoạt động cùng lúc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Không giới hạn Booths & Người tham gia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Bộ tiêu chí Checklist cơ bản</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6">
              <Button
                variant="outline"
                disabled={true}
                className="w-full text-xs border-slate-200 text-slate-400 bg-slate-50"
              >
                Gói mặc định
              </Button>
            </div>
          </div>

          {/* TIER 2: STARTER */}
          <div className={`rounded-2xl border p-6 flex flex-col justify-between relative transition-all ${
            currentTier === SubscriptionPlanTier.STARTER
              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md'
              : 'border-blue-200 bg-white hover:border-blue-400 shadow-sm'
          }`}>
            {starterConfig.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Phổ biến nhất
                </span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  {starterConfig.name}
                </h3>
                {currentTier === SubscriptionPlanTier.STARTER && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                    Đang dùng
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">{starterConfig.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">
                  {starterConfig.priceMonthlyVnd.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-xs text-slate-500 ml-1">/ tháng</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4">
                {starterConfig.features && starterConfig.features.length > 0 ? (
                  starterConfig.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span><strong>{starterConfig.maxActiveCampaigns} Chiến dịch</strong> hoạt động cùng lúc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Không giới hạn Booths & Người tham gia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Thư viện mẫu Checklist chuẩn hóa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Cộng dồn thời gian khi thanh toán sớm</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6">
              {currentTier === SubscriptionPlanTier.STARTER && isCurrentSubActive ? (
                <div className="space-y-1.5">
                  <Button
                    onClick={() => handlePlanAction(SubscriptionPlanTier.STARTER, starterConfig.name, starterConfig.priceMonthlyVnd)}
                    disabled={isPending}
                    className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                    Gia hạn {starterConfig.name} (+30 ngày)
                  </Button>
                  <p className="text-[11px] text-center text-blue-600 font-medium">
                    Cộng dồn 30 ngày vào thời hạn hiện tại
                  </p>
                </div>
              ) : currentTierLevel > PLAN_TIER_LEVEL[SubscriptionPlanTier.STARTER] && isCurrentSubActive ? (
                <div className="space-y-1.5">
                  <Button
                    disabled={true}
                    variant="outline"
                    className="w-full text-xs border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                  >
                    Đang dùng gói cao hơn
                  </Button>
                  <p className="text-[11px] text-center text-slate-500">
                    Gói {summary.planConfig.name} còn {summary.daysRemaining} ngày. Có thể đăng ký lại khi hết hạn.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Button
                    onClick={() => handlePlanAction(SubscriptionPlanTier.STARTER, starterConfig.name, starterConfig.priceMonthlyVnd)}
                    disabled={isPending}
                    className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1 text-amber-300" />}
                    Đăng ký {starterConfig.name} ({starterConfig.priceMonthlyVnd.toLocaleString('vi-VN')} đ)
                  </Button>
                  <p className="text-[11px] text-center text-slate-500">
                    Kích hoạt ngay 30 ngày sử dụng
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* TIER 3: PRO */}
          <div className={`rounded-2xl border p-6 flex flex-col justify-between relative transition-all ${
            currentTier === SubscriptionPlanTier.PRO
              ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}>
            {proConfig.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Phổ biến nhất
                </span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  {proConfig.name}
                </h3>
                {currentTier === SubscriptionPlanTier.PRO && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                    Đang dùng
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">{proConfig.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">
                  {proConfig.priceMonthlyVnd.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-xs text-slate-500 ml-1">/ tháng</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4">
                {proConfig.features && proConfig.features.length > 0 ? (
                  proConfig.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-purple-600 shrink-0" />
                      <span><strong>{proConfig.maxActiveCampaigns} Chiến dịch</strong> hoạt động cùng lúc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>Không giới hạn Booths & Người tham gia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>Ưu tiên tốc độ xử lý biên bản & đối soát</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>Hỗ trợ kỹ thuật 24/7</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6">
              {currentTier === SubscriptionPlanTier.PRO && isCurrentSubActive ? (
                <div className="space-y-1.5">
                  <Button
                    onClick={() => handlePlanAction(SubscriptionPlanTier.PRO, proConfig.name, proConfig.priceMonthlyVnd)}
                    disabled={isPending}
                    className="w-full text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                    Gia hạn {proConfig.name} (+30 ngày)
                  </Button>
                  <p className="text-[11px] text-center text-purple-600 font-medium">
                    Cộng dồn 30 ngày vào thời hạn hiện tại
                  </p>
                </div>
              ) : isCurrentSubActive && currentTierLevel < PLAN_TIER_LEVEL[SubscriptionPlanTier.PRO] ? (
                <div className="space-y-1.5">
                  <Button
                    onClick={() => handlePlanAction(SubscriptionPlanTier.PRO, proConfig.name, proConfig.priceMonthlyVnd)}
                    disabled={isPending}
                    className="w-full text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs font-semibold"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ArrowUpRight className="h-3.5 w-3.5 mr-1" />}
                    Nâng cấp {proConfig.name} ({proConfig.priceMonthlyVnd.toLocaleString('vi-VN')} đ)
                  </Button>
                  <p className="text-[11px] text-center text-amber-600 font-medium">
                    Kích hoạt ngay 30 ngày (sẽ thay thế gói hiện tại)
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Button
                    onClick={() => handlePlanAction(SubscriptionPlanTier.PRO, proConfig.name, proConfig.priceMonthlyVnd)}
                    disabled={isPending}
                    className="w-full text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1 text-purple-400" />}
                    Đăng ký {proConfig.name} ({proConfig.priceMonthlyVnd.toLocaleString('vi-VN')} đ)
                  </Button>
                  <p className="text-[11px] text-center text-slate-500">
                    Kích hoạt ngay 30 ngày sử dụng
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Block 3: Transaction & Invoicing History */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lịch Sử Giao Dịch & Hóa Đơn</h2>
          <p className="text-xs text-slate-500">
            Danh sách các đơn thanh toán gói dịch vụ của tài khoản bạn
          </p>
        </div>

        <TransactionHistoryTable transactions={transactions} />
      </div>

      {/* Upgrade Confirmation Dialog */}
      <Dialog
        open={!!upgradeConfirmData}
        onOpenChange={(open) => {
          if (!open) setUpgradeConfirmData(null);
        }}
      >
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Xác nhận nâng cấp gói {upgradeConfirmData?.planName}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Vui lòng kiểm tra kỹ chính sách chuyển đổi gói dịch vụ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            {/* Warning callout */}
            <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-3.5 text-amber-900 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                Thời hạn gói cũ sẽ không được cộng dồn
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                Gói <strong>{upgradeConfirmData?.planName}</strong> sẽ được kích hoạt ngay lập tức trong <strong>30 ngày</strong> kể từ khi thanh toán thành công.
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                Số ngày sử dụng còn lại của gói <strong>{summary.planConfig.name}</strong> hiện tại (<strong>{summary.daysRemaining} ngày</strong>) sẽ bị thay thế và không được bảo lưu hoặc cộng dồn.
              </p>
            </div>

            {/* Plan switch summary */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gói hiện tại:</span>
                <span className="font-semibold text-slate-700">
                  {summary.planConfig.name} ({summary.daysRemaining} ngày còn lại)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gói mới nâng cấp:</span>
                <span className="font-bold text-purple-700">
                  {upgradeConfirmData?.planName} (30 ngày từ hôm nay)
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="font-medium text-slate-700">Số tiền thanh toán:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {upgradeConfirmData?.price.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpgradeConfirmData(null)}
              className="text-xs border-slate-300"
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!upgradeConfirmData) return;
                const { targetPlan, planName } = upgradeConfirmData;
                setUpgradeConfirmData(null);
                handleOpenCheckout(targetPlan, planName);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Đồng ý & Tạo mã QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PayOS VietQR Checkout Modal */}
      {modalData && (
        <PayOSCheckoutModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetPlan={modalData.targetPlan}
          planName={modalData.planName}
          qrCodeUrl={modalData.qrCodeUrl}
          orderCode={modalData.orderCode}
          amount={modalData.amount}
          transactionCode={modalData.transactionCode}
          accountNumber={modalData.accountNumber}
          accountName={modalData.accountName}
          bankName={modalData.bankName}
          bin={modalData.bin}
          checkoutUrl={modalData.checkoutUrl}
          description={modalData.description}
          onSuccess={() => {
            loadData();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

