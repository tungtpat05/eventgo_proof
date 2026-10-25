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
import { BillingQuotaCard } from '@/features/subscriptions/components/billing-quota-card';
import { BillingPlanGrid } from '@/features/subscriptions/components/billing-plan-grid';
import { UpgradeConfirmDialog } from '@/features/subscriptions/components/upgrade-confirm-dialog';
import { SubscriptionPlanTier, Transaction, PLAN_CONFIGS, PlanConfig } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { CreditCard, RefreshCw, Loader2 } from 'lucide-react';

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

  const currentTier = summary?.subscription?.plan || SubscriptionPlanTier.FREE;
  const isCurrentSubActive = !!(
    summary?.subscription &&
    summary.subscription.plan !== SubscriptionPlanTier.FREE &&
    summary.subscription.expiresAt &&
    !summary.isExpired &&
    (summary.daysRemaining === null || summary.daysRemaining > 0)
  );

  const handlePlanAction = (targetPlan: SubscriptionPlanTier, planName: string, price: number) => {
    const PLAN_TIER_LEVEL: Record<SubscriptionPlanTier, number> = {
      [SubscriptionPlanTier.FREE]: 0,
      [SubscriptionPlanTier.STARTER]: 1,
      [SubscriptionPlanTier.PRO]: 2,
    };
    const currentTierLevel = isCurrentSubActive ? PLAN_TIER_LEVEL[currentTier] : 0;
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

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Đang tải thông tin gói dịch vụ & thanh toán...</p>
      </div>
    );
  }

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
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
          className="gap-1.5 text-xs self-start sm:self-auto border-slate-300 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          Làm mới
        </Button>
      </div>

      {/* Sub-component 1: Current Subscription Quota Overview */}
      <BillingQuotaCard summary={summary} />

      {/* Sub-component 2: Modular Pricing Plan Grid */}
      <BillingPlanGrid
        planConfigs={planConfigs}
        currentTier={currentTier}
        isCurrentSubActive={isCurrentSubActive}
        onSelectPlan={handlePlanAction}
      />

      {/* Sub-component 3: Transaction History Table */}
      <TransactionHistoryTable transactions={transactions} />

      {/* Sub-component 4: Upgrade Confirmation Modal */}
      {upgradeConfirmData && (
        <UpgradeConfirmDialog
          isOpen={!!upgradeConfirmData}
          onClose={() => setUpgradeConfirmData(null)}
          planName={upgradeConfirmData.planName}
          price={upgradeConfirmData.price}
          isPending={isPending}
          onConfirm={() => {
            const data = upgradeConfirmData;
            setUpgradeConfirmData(null);
            handleOpenCheckout(data.targetPlan, data.planName);
          }}
        />
      )}

      {/* Sub-component 5: PayOS Checkout Modal */}
      {modalData && (
        <PayOSCheckoutModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalData(null);
          }}
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
