import { SubscriptionPlanTier, TransactionStatus, PaymentGatewayProvider } from '../enums';

export interface Transaction {
  id: string;
  transactionCode: string;
  userId: string;
  plan: SubscriptionPlanTier;
  amount: number;
  currency: string;
  provider: PaymentGatewayProvider;
  status: TransactionStatus;
  paymentUrl?: string | null;
  qrCodeUrl?: string | null;
  gatewayTransactionId?: string | null;
  notes?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
