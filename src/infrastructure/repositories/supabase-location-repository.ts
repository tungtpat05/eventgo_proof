import { Location } from '@/domain/entities';
import { LocationRepository, LocationWriteInput } from '@/domain/repositories/location-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';

type LocationRow = Database['public']['Tables']['locations']['Row'];

function mapLocation(
  row: LocationRow,
  supervisorMemberId?: string | null,
  approverMemberId?: string | null
): Location {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    address: row.address,
    city: row.city,
    supervisorMemberId,
    approverMemberId,
    deadline: row.deadline ? new Date(row.deadline) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseLocationRepository implements LocationRepository {
  private async hydrateAssignments(rows: LocationRow[]): Promise<Location[]> {
    if (rows.length === 0) return [];
    const supabase = await createServerSupabaseClient();
    const ids = rows.map((row) => row.id);
    const [{ data: supervisors, error: supervisorError }, { data: approvers, error: approverError }] =
      await Promise.all([
        supabase
          .from('location_supervisor_assignments')
          .select('location_id, supervisor_member_id')
          .in('location_id', ids),
        supabase
          .from('location_approver_assignments')
          .select('location_id, approver_member_id')
          .in('location_id', ids),
      ]);

    if (supervisorError) throw new Error(supervisorError.message);
    if (approverError) throw new Error(approverError.message);
    const supervisorsByLocation = new Map(supervisors.map((item) => [item.location_id, item.supervisor_member_id]));
    const approversByLocation = new Map(approvers.map((item) => [item.location_id, item.approver_member_id]));

    return rows.map((row) =>
      mapLocation(row, supervisorsByLocation.get(row.id), approversByLocation.get(row.id))
    );
  }

  async findById(id: string): Promise<Location | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('locations').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return (await this.hydrateAssignments([data]))[0];
  }

  async findByCampaign(campaignId: string): Promise<Location[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('name');
    if (error) throw new Error(error.message);
    return this.hydrateAssignments(data);
  }

  async findAccessible(): Promise<Location[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('locations').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return this.hydrateAssignments(data);
  }

  async save(input: LocationWriteInput): Promise<Location> {
    const supabase = await createServerSupabaseClient();

    if (input.id) {
      const { data, error } = await supabase
        .from('locations')
        .update({
          name: input.name,
          address: input.address,
          city: input.city,
          deadline: input.deadline?.toISOString() || null,
        })
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return (await this.hydrateAssignments([data]))[0];
    }

    const { data, error } = await supabase
      .from('locations')
      .insert({
        campaign_id: input.campaignId,
        name: input.name,
        address: input.address,
        city: input.city,
        deadline: input.deadline?.toISOString() || null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapLocation(data);
  }

  async bulkSave(locations: LocationWriteInput[]): Promise<Location[]> {
    if (locations.length === 0) return [];
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('locations')
      .insert(
        locations.map((location) => ({
          campaign_id: location.campaignId,
          name: location.name,
          address: location.address,
          city: location.city,
          deadline: location.deadline?.toISOString() || null,
        }))
      )
      .select('*');
    if (error) throw new Error(error.message);
    return data.map((row) => mapLocation(row));
  }

  async assignPersonnel(
    locationId: string,
    supervisorMemberId?: string | null,
    approverMemberId?: string | null,
    deadline?: Date | null
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('assign_location_personnel', {
      p_location_id: locationId,
      p_supervisor_member_id: supervisorMemberId || null,
      p_approver_member_id: approverMemberId || null,
      p_deadline: deadline?.toISOString() || null,
    });
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
