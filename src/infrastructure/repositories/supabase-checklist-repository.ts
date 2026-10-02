import { ChecklistRepository } from '@/domain/repositories/checklist-repository';
import { ChecklistItem } from '@/domain/entities';
import { ChecklistCategory } from '@/domain/enums';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { env } from '@/config/env';
import { Database } from '@/types/database.types';

type ChecklistRow = Database['public']['Tables']['checklist_items']['Row'];

let inMemoryChecklistItems: ChecklistItem[] = [
  {
    id: 'item-booth-structure',
    campaignId: 'camp-summer-2026',
    title: 'Lắp đặt gian hàng theo thiết kế 3D đã duyệt',
    description: 'Chụp ảnh góc rộng toàn cảnh gian hàng từ phía trước và hai mặt bên, đảm bảo đúng kết cấu và kích thước.',
    category: ChecklistCategory.STRUCTURE,
    isRequired: true,
    orderIndex: 1,
    createdAt: new Date('2026-05-15'),
    updatedAt: new Date('2026-05-15'),
  },
  {
    id: 'item-brand-logo',
    campaignId: 'camp-summer-2026',
    title: 'Vị trí logo nhận diện thương hiệu',
    description: 'Chụp cận cảnh logo trên backdrop trung tâm và mặt trước quầy lễ tân, không bị che khuất hoặc nghiêng lệch.',
    category: ChecklistCategory.BRANDING,
    isRequired: true,
    orderIndex: 2,
    createdAt: new Date('2026-05-15'),
    updatedAt: new Date('2026-05-15'),
  },
  {
    id: 'item-posm-display',
    campaignId: 'camp-summer-2026',
    title: 'Standee và ấn phẩm POSM đầy đủ',
    description: 'Chụp toàn bộ standee khuyến mãi, tờ rơi giới thiệu và bảng báo giá được bố trí tại đúng vị trí quy định.',
    category: ChecklistCategory.POSM,
    isRequired: true,
    orderIndex: 3,
    createdAt: new Date('2026-05-15'),
    updatedAt: new Date('2026-05-15'),
  },
  {
    id: 'item-product-shelf',
    campaignId: 'camp-summer-2026',
    title: 'Khu vực trưng bày sản phẩm hoàn thiện',
    description: 'Chụp các line kệ trưng bày sản phẩm thật, sản phẩm dùng thử (sampling) đủ số lượng theo checklist bàn giao.',
    category: ChecklistCategory.CONDITION,
    isRequired: true,
    orderIndex: 4,
    createdAt: new Date('2026-05-15'),
    updatedAt: new Date('2026-05-15'),
  },
  {
    id: 'item-staffing',
    campaignId: 'camp-summer-2026',
    title: 'Nhân sự trực quầy (PG/PB) đúng giờ & trang phục chuẩn',
    description: 'Chụp đội ngũ nhân sự PG/PB có mặt tại gian hàng, mang thẻ sự kiện và mặc đồng phục đúng quy chuẩn.',
    category: ChecklistCategory.STAFFING,
    isRequired: true,
    orderIndex: 5,
    createdAt: new Date('2026-05-15'),
    updatedAt: new Date('2026-05-15'),
  },
];

export class SupabaseChecklistRepository implements ChecklistRepository {
  private isSupabaseConfigured(): boolean {
    return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  async findByCampaign(campaignId: string): Promise<ChecklistItem[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await (supabase.from('checklist_items') as any)
          .select('*')
          .eq('campaign_id', campaignId)
          .order('order_index');

        if (!error && data) {
          return (data as ChecklistRow[]).map((r) => ({
            id: r.id,
            campaignId: r.campaign_id,
            title: r.title,
            description: r.description,
            category: r.category,
            isRequired: r.is_required,
            orderIndex: r.order_index,
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
          }));
        }
      } catch {
        // Fall back to memory
      }
    }

    return inMemoryChecklistItems
      .filter((i) => i.campaignId === campaignId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async save(itemInput: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ChecklistItem> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        if (itemInput.id) {
          const { data, error } = await (supabase.from('checklist_items') as any)
            .update({
              title: itemInput.title,
              description: itemInput.description,
              category: itemInput.category,
              is_required: itemInput.isRequired,
              order_index: itemInput.orderIndex,
            })
            .eq('id', itemInput.id)
            .select()
            .single();

          if (error) throw new Error(error.message);
          const r = data as ChecklistRow;
          return {
            id: r.id,
            campaignId: r.campaign_id,
            title: r.title,
            description: r.description,
            category: r.category,
            isRequired: r.is_required,
            orderIndex: r.order_index,
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
          };
        } else {
          const { data, error } = await (supabase.from('checklist_items') as any)
            .insert({
              campaign_id: itemInput.campaignId,
              title: itemInput.title,
              description: itemInput.description,
              category: itemInput.category,
              is_required: itemInput.isRequired,
              order_index: itemInput.orderIndex,
            })
            .select()
            .single();

          if (error) throw new Error(error.message);
          const r = data as ChecklistRow;
          return {
            id: r.id,
            campaignId: r.campaign_id,
            title: r.title,
            description: r.description,
            category: r.category,
            isRequired: r.is_required,
            orderIndex: r.order_index,
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    const now = new Date();
    const newItem: ChecklistItem = {
      ...itemInput,
      id: itemInput.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryChecklistItems.push(newItem);
    return newItem;
  }

  async bulkSave(items: Array<Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ChecklistItem[]> {
    const created: ChecklistItem[] = [];
    for (const item of items) {
      created.push(await this.save(item));
    }
    return created;
  }

  async delete(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        await (supabase.from('checklist_items') as any).delete().eq('id', id);
        return;
      } catch {
        // Fall back to memory
      }
    }

    inMemoryChecklistItems = inMemoryChecklistItems.filter((i) => i.id !== id);
  }
}
