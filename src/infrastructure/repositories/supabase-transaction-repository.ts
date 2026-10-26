import { Transaction, TransactionStatus, SubscriptionPlanTier, PaymentGatewayProvider } from '@/domain/entities';
import { CreateTransactionParams, TransactionRepository } from '@/domain/repositories/transaction-repository';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    transactionCode: row.transaction_code,
    userId: row.user_id,
    plan: row.plan as SubscriptionPlanTier,
    amount: Number(row.amount),
    currency: row.currency,
    provider: row.provider as PaymentGatewayProvider,
    status: row.status as TransactionStatus,
    paymentUrl: row.payment_url,
    qrCodeUrl: row.qr_code_url,
    gatewayTransactionId: row.gateway_transaction_id,
    notes: row.notes,
    paidAt: row.paid_at ? new Date(row.paid_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseTransactionRepository implements TransactionRepository {
  private async getClient() {
    try {
      return createAdminSupabaseClient();
    } catch {
      return await createServerSupabaseClient();
    }
  }

  async create(params: CreateTransactionParams): Promise<Transaction> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        transaction_code: params.transactionCode,
        user_id: params.userId,
        plan: params.plan,
        amount: params.amount,
        currency: params.currency ?? 'VND',
        provider: params.provider ?? PaymentGatewayProvider.PAYOS_VIETQR,
        status: TransactionStatus.PENDING,
        payment_url: params.paymentUrl ?? null,
        qr_code_url: params.qrCodeUrl ?? null,
        gateway_transaction_id: params.gatewayTransactionId ?? null,
        notes: params.notes ?? null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapTransaction(data);
  }

  async getById(id: string): Promise<Transaction | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapTransaction(data) : null;
  }

  async getByCode(code: string): Promise<Transaction | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_code', code)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapTransaction(data) : null;
  }

  async getByGatewayTransactionId(gatewayId: string): Promise<Transaction | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('gateway_transaction_id', gatewayId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapTransaction(data) : null;
  }

  async getByUserId(userId: string): Promise<Transaction[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Transactions table query warning:', error.message);
      return [];
    }
    return (data || []).map(mapTransaction);
  }

  async getAll(params?: {
    status?: TransactionStatus;
    plan?: SubscriptionPlanTier;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    const supabase = await this.getClient();
    let query = supabase.from('transactions').select('*', { count: 'exact' });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.plan) query = query.eq('plan', params.plan);

    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) {
      console.warn('Transactions table getAll warning:', error.message);
      return { transactions: [], total: 0 };
    }

    return {
      transactions: (data || []).map(mapTransaction),
      total: count || 0,
    };
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    extra?: { paidAt?: Date; gatewayTransactionId?: string; notes?: string }
  ): Promise<Transaction> {
    const supabase = await this.getClient();
    const updates: Database['public']['Tables']['transactions']['Update'] = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (extra?.paidAt) updates.paid_at = extra.paidAt.toISOString();
    if (extra?.gatewayTransactionId) updates.gateway_transaction_id = extra.gatewayTransactionId;
    if (extra?.notes !== undefined) updates.notes = extra.notes;

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapTransaction(data);
  }
}
