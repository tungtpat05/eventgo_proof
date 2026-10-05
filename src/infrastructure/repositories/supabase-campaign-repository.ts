import { Campaign } from '@/domain/entities';
import { CampaignRepository, CampaignWriteInput } from '@/domain/repositories/campaign-repository';
import { CampaignMemberStatus, CampaignRole } from '@/domain/enums';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

function mapCampaign(row: CampaignRow, role: CampaignRole): Campaign {
  return {
    id: row.id,
    title: row.title,
    brandName: row.brand_name,
    description: row.description,
    companyName: row.company_name,
    companyTaxCode: row.company_tax_code,
    companyAddress: row.company_address,
    companyContactName: row.company_contact_name,
    companyContactEmail: row.company_contact_email,
    companyContactPhone: row.company_contact_phone,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    status: row.status,
    createdBy: row.created_by,
    currentUserRole: role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseCampaignRepository implements CampaignRepository {
  async findById(id: string): Promise<Campaign | null> {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const [{ data: campaign, error }, { data: membership }] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('campaign_members')
        .select('role')
        .eq('campaign_id', id)
        .eq('user_id', userData.user.id)
        .eq('status', CampaignMemberStatus.ACTIVE)
        .maybeSingle(),
    ]);

    if (error) throw new Error(error.message);
    if (!campaign || !membership) return null;
    return mapCampaign(campaign, membership.role);
  }

  async findAccessibleByUser(userId: string): Promise<Campaign[]> {
    const supabase = await createServerSupabaseClient();
    const [{ data: campaigns, error }, { data: memberships, error: membershipError }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase
        .from('campaign_members')
        .select('campaign_id, role')
        .eq('user_id', userId)
        .eq('status', CampaignMemberStatus.ACTIVE),
    ]);

    if (error) throw new Error(error.message);
    if (membershipError) throw new Error(membershipError.message);

    const roleByCampaign = new Map(memberships.map((item) => [item.campaign_id, item.role]));
    return campaigns.flatMap((row) => {
      const role = roleByCampaign.get(row.id);
      return role ? [mapCampaign(row, role)] : [];
    });
  }

  async save(input: CampaignWriteInput): Promise<Campaign> {
    const supabase = await createServerSupabaseClient();

    if (!input.id) {
      const { data: campaignId, error } = await supabase.rpc('create_campaign_with_manager', {
        p_title: input.title,
        p_brand_name: input.brandName,
        p_description: input.description || '',
        p_company_name: input.companyName,
        p_company_tax_code: input.companyTaxCode || '',
        p_company_address: input.companyAddress || '',
        p_company_contact_name: input.companyContactName || '',
        p_company_contact_email: input.companyContactEmail || '',
        p_company_contact_phone: input.companyContactPhone || '',
        p_start_date: input.startDate.toISOString().split('T')[0],
        p_end_date: input.endDate.toISOString().split('T')[0],
        p_status: input.status,
      });
      if (error) throw new Error(error.message);
      const created = campaignId ? await this.findById(campaignId) : null;
      if (!created) throw new Error('Không thể tải chiến dịch vừa tạo.');
      return created;
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        title: input.title,
        brand_name: input.brandName,
        description: input.description,
        company_name: input.companyName,
        company_tax_code: input.companyTaxCode,
        company_address: input.companyAddress,
        company_contact_name: input.companyContactName,
        company_contact_email: input.companyContactEmail,
        company_contact_phone: input.companyContactPhone,
        start_date: input.startDate.toISOString().split('T')[0],
        end_date: input.endDate.toISOString().split('T')[0],
        status: input.status,
      })
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapCampaign(data, CampaignRole.MANAGER);
  }

  async updateStatus(id: string, status: Campaign['status']): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('campaigns').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
