import { Subscription, SubscriptionPlanTier, SubscriptionStatus, PlanConfig, PLAN_CONFIGS } from '@/domain/entities';
import { SubscriptionRepository } from '@/domain/repositories/subscription-repository';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type PlanConfigRow = Database['public']['Tables']['subscription_plan_configs']['Row'];

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

function mapPlanConfig(row: PlanConfigRow): PlanConfig {
  let features: string[] = [];
  if (Array.isArray(row.features)) {
    features = row.features as string[];
  } else if (typeof row.features === 'string') {
    try {
      features = JSON.parse(row.features);
    } catch {
      features = [];
    }
  }

  return {
    tier: row.tier as SubscriptionPlanTier,
    name: row.name,
    priceMonthlyVnd: Number(row.price_monthly_vnd),
    maxActiveCampaigns: row.max_active_campaigns,
    maxBooths: row.max_booths,
    maxParticipants: row.max_participants,
    description: row.description,
    features,
    isPopular: row.is_popular,
    isActive: row.is_active,
  };
}

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  private async getClient() {
    try {
      return createAdminSupabaseClient();
    } catch {
      return await createServerSupabaseClient();
    }
  }

  async getByUserId(userId: string): Promise<Subscription | null> {
    const supabase = await this.getClient();
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
    const supabase = await this.getClient();
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
    const supabase = await this.getClient();
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

  async getPlanConfigs(): Promise<PlanConfig[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('subscription_plan_configs')
        .select('*')
        .order('price_monthly_vnd', { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn('subscription_plan_configs query warning, falling back to static config:', error.message);
        }
        return [
          PLAN_CONFIGS[SubscriptionPlanTier.FREE],
          PLAN_CONFIGS[SubscriptionPlanTier.STARTER],
          PLAN_CONFIGS[SubscriptionPlanTier.PRO],
        ];
      }

      return data.map(mapPlanConfig);
    } catch (err) {
      console.warn('Error fetching plan configs, using fallback:', err);
      return [
        PLAN_CONFIGS[SubscriptionPlanTier.FREE],
        PLAN_CONFIGS[SubscriptionPlanTier.STARTER],
        PLAN_CONFIGS[SubscriptionPlanTier.PRO],
      ];
    }
  }

  async getPlanConfigByTier(tier: SubscriptionPlanTier): Promise<PlanConfig> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('subscription_plan_configs')
        .select('*')
        .eq('tier', tier)
        .maybeSingle();

      if (error || !data) {
        return PLAN_CONFIGS[tier];
      }

      return mapPlanConfig(data);
    } catch (err) {
      console.warn(`Error fetching plan config for ${tier}, using fallback:`, err);
      return PLAN_CONFIGS[tier];
    }
  }

  async updatePlanConfig(
    tier: SubscriptionPlanTier,
    data: Partial<PlanConfig>
  ): Promise<PlanConfig> {
    const supabase = await createServerSupabaseClient();

    const updatePayload: Database['public']['Tables']['subscription_plan_configs']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.priceMonthlyVnd !== undefined) updatePayload.price_monthly_vnd = data.priceMonthlyVnd;
    if (data.maxActiveCampaigns !== undefined) updatePayload.max_active_campaigns = data.maxActiveCampaigns;
    if (data.maxBooths !== undefined) updatePayload.max_booths = data.maxBooths;
    if (data.maxParticipants !== undefined) updatePayload.max_participants = data.maxParticipants;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.features !== undefined) updatePayload.features = data.features;
    if (data.isPopular !== undefined) updatePayload.is_popular = data.isPopular;
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

    const { data: updated, error } = await supabase
      .from('subscription_plan_configs')
      .update(updatePayload)
      .eq('tier', tier)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Lỗi cập nhật cấu hình gói: ${error.message}`);
    }

    return mapPlanConfig(updated);
  }
}

