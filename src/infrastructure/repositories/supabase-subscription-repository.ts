import { Subscription, SubscriptionPlanTier, SubscriptionStatus } from '@/domain/entities';
import { SubscriptionRepository } from '@/domain/repositories/subscription-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan as SubscriptionPlanTier,
    status: row.status as SubscriptionStatus,
    startedAt: new Date(row.started_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  async getByUserId(userId: string): Promise<Subscription | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Subscriptions table query warning:', error.message);
      return null;
    }
    if (!data) return null;

    const sub = mapSubscription(data);

    // Lazy evaluation: If expired, automatically downgrade in-memory & trigger background sync
    if (sub.expiresAt && sub.expiresAt < new Date() && sub.status === SubscriptionStatus.ACTIVE) {
      await supabase
        .from('subscriptions')
        .update({
          status: SubscriptionStatus.EXPIRED,
          plan: SubscriptionPlanTier.FREE,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);
      sub.status = SubscriptionStatus.EXPIRED;
      sub.plan = SubscriptionPlanTier.FREE;
    }

    return sub;
  }

  async upsert(params: {
    userId: string;
    plan: SubscriptionPlanTier;
    status: SubscriptionStatus;
    expiresAt?: Date | null;
  }): Promise<Subscription> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: params.userId,
          plan: params.plan,
          status: params.status,
          expires_at: params.expiresAt ? params.expiresAt.toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapSubscription(data);
  }

  async getAll(params?: {
    plan?: SubscriptionPlanTier;
    status?: SubscriptionStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ subscriptions: Subscription[]; total: number }> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from('subscriptions').select('*', { count: 'exact' });

    if (params?.plan) query = query.eq('plan', params.plan);
    if (params?.status) query = query.eq('status', params.status);

    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      subscriptions: (data || []).map(mapSubscription),
      total: count || 0,
    };
  }
}
