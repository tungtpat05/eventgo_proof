import { Transaction, TransactionStatus, SubscriptionPlanTier, PaymentGatewayProvider } from '../entities';

export interface CreateTransactionParams {
  transactionCode: string;
  userId: string;
  plan: SubscriptionPlanTier;
  amount: number;
  currency?: string;
  provider?: PaymentGatewayProvider;
  paymentUrl?: string | null;
  qrCodeUrl?: string | null;
  gatewayTransactionId?: string | null;
  notes?: string | null;
}

export interface TransactionRepository {
  create(params: CreateTransactionParams): Promise<Transaction>;
  getById(id: string): Promise<Transaction | null>;
  getByCode(code: string): Promise<Transaction | null>;
  getByUserId(userId: string): Promise<Transaction[]>;
  getAll(params?: {
    status?: TransactionStatus;
    plan?: SubscriptionPlanTier;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: Transaction[]; total: number }>;
  updateStatus(
    id: string,
    status: TransactionStatus,
    extra?: { paidAt?: Date; gatewayTransactionId?: string; notes?: string }
  ): Promise<Transaction>;
}
