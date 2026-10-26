import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { ChecklistItem } from '@/domain/entities';

export interface DuplicateBoothInput {
  sourceBoothId: string;
  targetLocationId?: string;
  newName?: string;
  newCode?: string | null;
}

export async function duplicateBoothUseCase(input: DuplicateBoothInput): Promise<string> {
  const supabase = await createServerSupabaseClient();

  // 1. Get source booth
  const { data: sourceBooth, error: boothError } = await supabase
    .from('booths')
    .select('*, locations(campaign_id)')
    .eq('id', input.sourceBoothId)
    .single();

  if (boothError || !sourceBooth) {
    throw new Error('Không tìm thấy gian hàng nguồn để nhân bản');
  }

  const campaignId = (sourceBooth.locations as any)?.campaign_id;
  if (!campaignId) {
    throw new Error('Dữ liệu chiến dịch không hợp lệ');
  }

  await requireCampaignManager(campaignId);
  const adminClient = createAdminSupabaseClient();

  const targetLocationId = input.targetLocationId || sourceBooth.location_id;
  const newName = input.newName || `${sourceBooth.name} (Bản sao)`;
  const newCode = input.newCode !== undefined ? input.newCode : sourceBooth.code ? `${sourceBooth.code}-COPY` : null;

  // 2. Insert new booth
  const { data: newBooth, error: insertError } = await adminClient
    .from('booths')
    .insert({
      location_id: targetLocationId,
      name: newName,
      code: newCode,
      description: sourceBooth.description,
      deadline: sourceBooth.deadline,
    })
    .select('id')
    .single();

  if (insertError || !newBooth) {
    throw new Error(`Lỗi khi tạo gian hàng mới: ${insertError?.message}`);
  }

  // 3. Clone checklist items from source booth
  const { data: sourceItems } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('booth_id', input.sourceBoothId)
    .order('order_index');

  if (sourceItems && sourceItems.length > 0) {
    const itemsToInsert = sourceItems.map((item) => ({
      booth_id: newBooth.id,
      title: item.title,
      description: item.description,
      category: item.category,
      is_required: item.is_required,
      order_index: item.order_index,
    }));

    await adminClient.from('checklist_items').insert(itemsToInsert);
  }

  return newBooth.id;
}

export interface BatchApplyChecklistInput {
  campaignId: string;
  sourceBoothId?: string;
  templateItems?: {
    title: string;
    description?: string | null;
    category?: any;
    isRequired?: boolean;
    orderIndex?: number;
  }[];
  targetBoothIds: string[];
  mode?: 'REPLACE' | 'APPEND';
}

export async function batchApplyChecklistUseCase(input: BatchApplyChecklistInput): Promise<void> {
  if (input.targetBoothIds.length === 0) return;

  await requireCampaignManager(input.campaignId);
  const supabase = await createServerSupabaseClient();

  let itemsToCopy: {
    title: string;
    description?: string | null;
    category: any;
    is_required: boolean;
    order_index: number;
  }[] = [];

  if (input.templateItems && input.templateItems.length > 0) {
    itemsToCopy = input.templateItems.map((it, idx) => ({
      title: it.title,
      description: it.description || null,
      category: it.category || 'OTHER',
      is_required: it.isRequired !== false,
      order_index: it.orderIndex || idx + 1,
    }));
  } else if (input.sourceBoothId) {
    const { data: sourceItems } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('booth_id', input.sourceBoothId)
      .order('order_index');

    if (sourceItems) {
      itemsToCopy = sourceItems.map((it) => ({
        title: it.title,
        description: it.description,
        category: it.category,
        is_required: it.is_required,
        order_index: it.order_index,
      }));
    }
  }

  if (itemsToCopy.length === 0) {
    throw new Error('Không có tiêu chí checklist nào để áp dụng');
  }

  // Delete existing items if mode is REPLACE (default)
  const mode = input.mode || 'REPLACE';
  if (mode === 'REPLACE') {
    await supabase.from('checklist_items').delete().in('booth_id', input.targetBoothIds);
  }

  // Prepare batch insert
  const allRows: any[] = [];
  for (const boothId of input.targetBoothIds) {
    for (const item of itemsToCopy) {
      allRows.push({
        booth_id: boothId,
        title: item.title,
        description: item.description,
        category: item.category,
        is_required: item.is_required,
        order_index: item.order_index,
      });
    }
  }

  const { error: insertError } = await supabase.from('checklist_items').insert(allRows);
  if (insertError) {
    throw new Error(`Lỗi khi áp dụng checklist hàng loạt: ${insertError.message}`);
  }
}

import { assignBoothPersonnelUseCase } from './manage-booth';

export interface CascadeLocationSupervisorInput {
  campaignId: string;
  locationId: string;
  supervisorMemberId: string | null;
  applyToAllBooths?: boolean;
}

export async function cascadeLocationSupervisorUseCase(input: CascadeLocationSupervisorInput): Promise<void> {
  await requireCampaignManager(input.campaignId);
  const supabase = await createServerSupabaseClient();

  // Try updating default_supervisor_member_id on location if column exists and is a valid UUID (not an invite)
  if (input.supervisorMemberId && !input.supervisorMemberId.startsWith('invite_')) {
    try {
      await (supabase.from('locations').update as any)({
        default_supervisor_member_id: input.supervisorMemberId,
      }).eq('id', input.locationId);
    } catch (err) {
      // If column doesn't exist, ignore
    }
  } else if (input.supervisorMemberId === null) {
    try {
      await (supabase.from('locations').update as any)({
        default_supervisor_member_id: null,
      }).eq('id', input.locationId);
    } catch (err) {
      // If column doesn't exist, ignore
    }
  }

  if (input.applyToAllBooths && input.supervisorMemberId) {
    // 1. Fetch all child booths of this location
    const { data: booths } = await supabase
      .from('booths')
      .select('id')
      .eq('location_id', input.locationId);

    const boothIds = (booths || []).map((b) => b.id);
    if (boothIds.length === 0) return;

    // 2. Assign supervisor for each booth using the domain use case
    for (const boothId of boothIds) {
      await assignBoothPersonnelUseCase({
        boothId,
        supervisorMemberId: input.supervisorMemberId,
      });
    }
  }
}
