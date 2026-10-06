import { Location } from '@/domain/entities';
import { LocationRepository, LocationWriteInput } from '@/domain/repositories/location-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';
import { SupabaseBoothRepository } from './supabase-booth-repository';

type LocationRow = Database['public']['Tables']['locations']['Row'];

function mapLocation(row: LocationRow): Location {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    address: row.address,
    city: row.city,
    deadline: row.deadline ? new Date(row.deadline) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseLocationRepository implements LocationRepository {
  async findById(id: string): Promise<Location | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('locations').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const location = mapLocation(data);
    const boothRepo = new SupabaseBoothRepository();
    location.booths = await boothRepo.findByLocation(id);
    return location;
  }

  async findByCampaign(campaignId: string): Promise<Location[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('name');
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    const boothRepo = new SupabaseBoothRepository();
    const allBooths = await boothRepo.findByCampaign(campaignId);
    const boothsByLoc = new Map<string, typeof allBooths>();
    for (const b of allBooths) {
      const list = boothsByLoc.get(b.locationId) || [];
      list.push(b);
      boothsByLoc.set(b.locationId, list);
    }

    return data.map((row) => {
      const loc = mapLocation(row);
      loc.booths = boothsByLoc.get(loc.id) || [];
      return loc;
    });
  }

  async findAccessible(): Promise<Location[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('locations').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapLocation);
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
      return mapLocation(data);
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

  async delete(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
