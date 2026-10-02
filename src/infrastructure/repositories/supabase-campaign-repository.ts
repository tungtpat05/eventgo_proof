import { CampaignRepository } from '@/domain/repositories/campaign-repository';
import { Campaign } from '@/domain/entities';
import { CampaignStatus } from '@/domain/enums';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { env } from '@/config/env';
import { Database } from '@/types/database.types';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

// In-memory store for fallback/demo mode when Supabase credentials are pending
let inMemoryCampaigns: Campaign[] = [
  {
    id: 'camp-summer-2026',
    organizationId: 'demo-org-uuid',
    title: 'Summer Activation 2026 — Trưng Bày Đồ Uống Mùa Hè',
    brandName: 'FreshJuice Co.',
    description: 'Chiến dịch kích hoạt thương hiệu tại 15 trung tâm thương mại lớn Hà Nội & TP.HCM.',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-08-30'),
    status: CampaignStatus.ACTIVE,
    createdBy: 'demo-pm-uuid',
    createdAt: new Date('2026-05-15'),
    updatedAt: new Date('2026-05-15'),
  },
  {
    id: 'camp-tech-roadshow',
    organizationId: 'demo-org-uuid',
    title: 'Tech Roadshow 2026 — Trải Nghiệm Laptop AI',
    brandName: 'NexGen Tech',
    description: 'Roadshow quảng bá dòng sản phẩm laptop trí tuệ nhân tạo thế hệ mới.',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-10-15'),
    status: CampaignStatus.DRAFT,
    createdBy: 'demo-pm-uuid',
    createdAt: new Date('2026-08-20'),
    updatedAt: new Date('2026-08-20'),
  },
];

export class SupabaseCampaignRepository implements CampaignRepository {
  private isSupabaseConfigured(): boolean {
    return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  async findById(id: string): Promise<Campaign | null> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await (supabase.from('campaigns') as any)
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return null;
        const row = data as CampaignRow;

        return {
          id: row.id,
          organizationId: row.organization_id,
          title: row.title,
          brandName: row.brand_name,
          description: row.description,
          startDate: new Date(row.start_date),
          endDate: new Date(row.end_date),
          status: row.status,
          createdBy: row.created_by,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      } catch {
        // Fall back to memory
      }
    }

    const found = inMemoryCampaigns.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async findByOrganization(organizationId: string): Promise<Campaign[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await (supabase.from('campaigns') as any)
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return (data as CampaignRow[]).map((item) => ({
            id: item.id,
            organizationId: item.organization_id,
            title: item.title,
            brandName: item.brand_name,
            description: item.description,
            startDate: new Date(item.start_date),
            endDate: new Date(item.end_date),
            status: item.status,
            createdBy: item.created_by,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));
        }
      } catch {
        // Fall back to memory
      }
    }

    return [...inMemoryCampaigns].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async save(campaignInput: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Campaign> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        if (campaignInput.id) {
          const { data, error } = await (supabase.from('campaigns') as any)
            .update({
              title: campaignInput.title,
              brand_name: campaignInput.brandName,
              description: campaignInput.description,
              start_date: campaignInput.startDate.toISOString().split('T')[0],
              end_date: campaignInput.endDate.toISOString().split('T')[0],
              status: campaignInput.status,
            })
            .eq('id', campaignInput.id)
            .select()
            .single();

          if (error) throw new Error(error.message);
          const row = data as CampaignRow;
          return {
            id: row.id,
            organizationId: row.organization_id,
            title: row.title,
            brandName: row.brand_name,
            description: row.description,
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            status: row.status,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          };
        } else {
          const { data, error } = await (supabase.from('campaigns') as any)
            .insert({
              organization_id: campaignInput.organizationId,
              title: campaignInput.title,
              brand_name: campaignInput.brandName,
              description: campaignInput.description,
              start_date: campaignInput.startDate.toISOString().split('T')[0],
              end_date: campaignInput.endDate.toISOString().split('T')[0],
              status: campaignInput.status,
              created_by: campaignInput.createdBy,
            })
            .select()
            .single();

          if (error) throw new Error(error.message);
          const row = data as CampaignRow;
          return {
            id: row.id,
            organizationId: row.organization_id,
            title: row.title,
            brandName: row.brand_name,
            description: row.description,
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            status: row.status,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    const now = new Date();
    if (campaignInput.id) {
      const idx = inMemoryCampaigns.findIndex((c) => c.id === campaignInput.id);
      if (idx !== -1) {
        inMemoryCampaigns[idx] = {
          ...inMemoryCampaigns[idx],
          ...campaignInput,
          updatedAt: now,
        };
        return inMemoryCampaigns[idx];
      }
    }

    const newCampaign: Campaign = {
      ...campaignInput,
      id: campaignInput.id || `camp-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryCampaigns.unshift(newCampaign);
    return newCampaign;
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<void> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        await (supabase.from('campaigns') as any).update({ status }).eq('id', id);
        return;
      } catch {
        // Fall back to memory
      }
    }

    const campaign = inMemoryCampaigns.find((c) => c.id === id);
    if (campaign) {
      campaign.status = status;
      campaign.updatedAt = new Date();
    }
  }

  async delete(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        await (supabase.from('campaigns') as any).delete().eq('id', id);
        return;
      } catch {
        // Fall back to memory
      }
    }

    inMemoryCampaigns = inMemoryCampaigns.filter((c) => c.id !== id);
  }
}
