import { ChecklistItem } from '@/domain/entities';
import { ChecklistRepository } from '@/domain/repositories/checklist-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';

type ChecklistRow = Database['public']['Tables']['checklist_items']['Row'];

function mapChecklistItem(row: ChecklistRow): ChecklistItem {
  return {
    id: row.id,
    boothId: row.booth_id,
    title: row.title,
    description: row.description,
    category: row.category,
    isRequired: row.is_required,
    orderIndex: row.order_index,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseChecklistRepository implements ChecklistRepository {
  async findByBooth(boothId: string): Promise<ChecklistItem[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('booth_id', boothId)
      .order('order_index');
    if (error) throw new Error(error.message);
    return (data || []).map(mapChecklistItem);
  }

  async findByCampaign(campaignId: string): Promise<ChecklistItem[]> {
    const supabase = await createServerSupabaseClient();
    // First find all booths in this campaign
    const { data: locations } = await supabase.from('locations').select('id').eq('campaign_id', campaignId);
    if (!locations || locations.length === 0) return [];

    const locIds = locations.map((l) => l.id);
    const { data: booths } = await supabase.from('booths').select('id').in('location_id', locIds);
    if (!booths || booths.length === 0) return [];

    const boothIds = booths.map((b) => b.id);
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .in('booth_id', boothIds)
      .order('order_index');
    if (error) throw new Error(error.message);
    return (data || []).map(mapChecklistItem);
  }

  async save(input: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ChecklistItem> {
    const supabase = await createServerSupabaseClient();
    if (input.id) {
      const { data, error } = await supabase
        .from('checklist_items')
        .update({
          title: input.title,
          description: input.description,
          category: input.category,
          is_required: input.isRequired,
          order_index: input.orderIndex,
        })
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapChecklistItem(data);
    }

    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        booth_id: input.boothId,
        title: input.title,
        description: input.description,
        category: input.category,
        is_required: input.isRequired,
        order_index: input.orderIndex,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapChecklistItem(data);
  }

  async bulkSave(items: Array<Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ChecklistItem[]> {
    if (items.length === 0) return [];
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('checklist_items')
      .insert(
        items.map((item) => ({
          booth_id: item.boothId,
          title: item.title,
          description: item.description,
          category: item.category,
          is_required: item.isRequired,
          order_index: item.orderIndex,
        }))
      )
      .select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(mapChecklistItem);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
