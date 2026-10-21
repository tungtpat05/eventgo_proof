import { Booth } from '@/domain/entities';
import { BoothRepository, BoothWriteInput } from '@/domain/repositories/booth-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { SubmissionStatus } from '@/domain/enums';

export class SupabaseBoothRepository implements BoothRepository {
  async findById(id: string): Promise<Booth | null> {
    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from('booths')
      .select(`
        *,
        booth_supervisor_assignments(
          supervisor_member_id,
          campaign_members!booth_supervisor_assignments_supervisor_member_id_fkey(
            profiles(full_name)
          )
        ),
        booth_approver_assignments(
          approver_member_id,
          campaign_members!booth_approver_assignments_approver_member_id_fkey(
            profiles(full_name)
          )
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      // Fallback simple query if complex relation naming fails
      const { data: simpleRow, error: simpleError } = await supabase
        .from('booths')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (simpleError) throw new Error(simpleError.message);
      if (!simpleRow) return null;
      return this.enrichBooth(simpleRow);
    }

    if (!row) return null;
    return this.mapEnrichedBooth(row);
  }

  async findByLocation(locationId: string): Promise<Booth[]> {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase
      .from('booths')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return [];

    return await Promise.all(rows.map((r) => this.enrichBooth(r)));
  }

  async findByCampaign(campaignId: string): Promise<Booth[]> {
    const supabase = await createServerSupabaseClient();
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id')
      .eq('campaign_id', campaignId);

    if (locError) throw new Error(locError.message);
    if (!locations || locations.length === 0) return [];

    const locIds = locations.map((l) => l.id);
    const { data: rows, error } = await supabase
      .from('booths')
      .select('*')
      .in('location_id', locIds)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return [];

    return await Promise.all(rows.map((r) => this.enrichBooth(r)));
  }

  async save(booth: BoothWriteInput): Promise<Booth> {
    const supabase = await createServerSupabaseClient();

    if (booth.id) {
      const { data, error } = await supabase
        .from('booths')
        .update({
          name: booth.name,
          code: booth.code || null,
          description: booth.description || null,
          deadline: booth.deadline ? booth.deadline.toISOString() : null,
        })
        .eq('id', booth.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return await this.enrichBooth(data);
    }

    const { data, error } = await supabase
      .from('booths')
      .insert({
        location_id: booth.locationId,
        name: booth.name,
        code: booth.code || null,
        description: booth.description || null,
        deadline: booth.deadline ? booth.deadline.toISOString() : null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return await this.enrichBooth(data);
  }

  async assignPersonnel(
    boothId: string,
    supervisorMemberId?: string | null,
    approverMemberId?: string | null,
    deadline?: Date | null,
    supervisorInviteId?: string | null,
    approverInviteId?: string | null
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();

    let finalSupMemberId = supervisorMemberId || null;
    let finalSupInviteId = supervisorInviteId || null;
    if (finalSupMemberId && finalSupMemberId.startsWith('invite_')) {
      finalSupInviteId = finalSupMemberId.replace('invite_', '');
      finalSupMemberId = null;
    }

    let finalAppMemberId = approverMemberId || null;
    let finalAppInviteId = approverInviteId || null;
    if (finalAppMemberId && finalAppMemberId.startsWith('invite_')) {
      finalAppInviteId = finalAppMemberId.replace('invite_', '');
      finalAppMemberId = null;
    }

    const { error } = await supabase.rpc('assign_booth_personnel', {
      p_booth_id: boothId,
      p_supervisor_member_id: finalSupMemberId,
      p_approver_member_id: finalAppMemberId,
      p_deadline: deadline ? deadline.toISOString() : null,
      p_supervisor_invite_id: finalSupInviteId,
      p_approver_invite_id: finalAppInviteId,
    } as any);

    if (error) {
      // Fallback nếu database chưa chạy migration bổ sung tham số invite_id
      if (
        error.message.includes('p_supervisor_invite_id') ||
        error.message.includes('function') ||
        error.message.includes('parameters')
      ) {
        const { error: fallbackErr } = await supabase.rpc('assign_booth_personnel', {
          p_booth_id: boothId,
          p_supervisor_member_id: finalSupMemberId,
          p_approver_member_id: finalAppMemberId,
          p_deadline: deadline ? deadline.toISOString() : null,
        });
        if (fallbackErr) throw new Error(fallbackErr.message);
      } else {
        throw new Error(error.message);
      }
    }
  }

  async delete(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('booths').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  private async enrichBooth(row: {
    id: string;
    location_id: string;
    name: string;
    code: string | null;
    description: string | null;
    deadline: string | null;
    created_at: string;
    updated_at: string;
  }): Promise<Booth> {
    const supabase = await createServerSupabaseClient();

    const [
      { data: supervisorRow },
      { data: approverRow },
      { count: checklistCount },
      { count: approvedCount },
    ] = await Promise.all([
      supabase
        .from('booth_supervisor_assignments')
        .select('supervisor_member_id')
        .eq('booth_id', row.id)
        .maybeSingle(),
      supabase
        .from('booth_approver_assignments')
        .select('approver_member_id')
        .eq('booth_id', row.id)
        .maybeSingle(),
      supabase
        .from('checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('booth_id', row.id),
      supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('booth_id', row.id)
        .eq('status', SubmissionStatus.APPROVED),
    ]);

    let supervisorName: string | null = null;
    let approverName: string | null = null;

    if (supervisorRow?.supervisor_member_id) {
      const { data: member } = await supabase
        .from('campaign_members')
        .select('profiles(full_name)')
        .eq('id', supervisorRow.supervisor_member_id)
        .maybeSingle();
      const profile = member?.profiles as unknown as { full_name: string } | null;
      supervisorName = profile?.full_name || null;
    }

    if (approverRow?.approver_member_id) {
      const { data: member } = await supabase
        .from('campaign_members')
        .select('profiles(full_name)')
        .eq('id', approverRow.approver_member_id)
        .maybeSingle();
      const profile = member?.profiles as unknown as { full_name: string } | null;
      approverName = profile?.full_name || null;
    }

    return {
      id: row.id,
      locationId: row.location_id,
      name: row.name,
      code: row.code,
      description: row.description,
      deadline: row.deadline ? new Date(row.deadline) : null,
      supervisorMemberId: supervisorRow?.supervisor_member_id || null,
      supervisorName,
      approverMemberId: approverRow?.approver_member_id || null,
      approverName,
      checklistCount: checklistCount || 0,
      completedChecklistCount: approvedCount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapEnrichedBooth(row: any): Booth {
    const sup = row.booth_supervisor_assignments?.[0];
    const app = row.booth_approver_assignments?.[0];

    return {
      id: row.id,
      locationId: row.location_id,
      name: row.name,
      code: row.code,
      description: row.description,
      deadline: row.deadline ? new Date(row.deadline) : null,
      supervisorMemberId: sup?.supervisor_member_id || null,
      supervisorName: sup?.campaign_members?.profiles?.full_name || null,
      approverMemberId: app?.approver_member_id || null,
      approverName: app?.campaign_members?.profiles?.full_name || null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
