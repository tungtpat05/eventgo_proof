import { LocationRepository } from '@/domain/repositories/location-repository';
import { Location } from '@/domain/entities';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { env } from '@/config/env';
import { Database } from '@/types/database.types';

type LocationRow = Database['public']['Tables']['locations']['Row'];

// In-memory store for fallback/demo mode when Supabase credentials are pending
let inMemoryLocations: Location[] = [
  {
    id: 'loc-vincom-ba-trieu',
    campaignId: 'camp-summer-2026',
    organizationId: 'demo-org-uuid',
    name: 'Gian Hàng Tầng 1 — Vincom Center Bà Triệu',
    address: '191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng',
    city: 'Hà Nội',
    assignedSupervisorId: 'demo-supervisor-uuid',
    assignedApproverId: 'demo-approver-uuid',
    deadline: new Date('2026-06-15T18:00:00Z'),
    createdAt: new Date('2026-05-20'),
    updatedAt: new Date('2026-05-20'),
  },
  {
    id: 'loc-aeon-mall-ha-dong',
    campaignId: 'camp-summer-2026',
    organizationId: 'demo-org-uuid',
    name: 'Khu Hoạt Náo Sảnh Đông — Aeon Mall Hà Đông',
    address: 'Khu đô thị Dương Nội, Hà Đông',
    city: 'Hà Nội',
    assignedSupervisorId: 'demo-supervisor-uuid',
    assignedApproverId: 'demo-approver-uuid',
    deadline: new Date('2026-06-20T18:00:00Z'),
    createdAt: new Date('2026-05-20'),
    updatedAt: new Date('2026-05-20'),
  },
  {
    id: 'loc-lotte-west-lake',
    campaignId: 'camp-summer-2026',
    organizationId: 'demo-org-uuid',
    name: 'Quầy Kích Hoạt Trung Tâm — Lotte Mall West Lake',
    address: '272 Võ Chí Công, Tây Hồ',
    city: 'Hà Nội',
    assignedSupervisorId: 'demo-supervisor-uuid',
    assignedApproverId: 'demo-approver-uuid',
    deadline: new Date('2026-06-25T18:00:00Z'),
    createdAt: new Date('2026-05-20'),
    updatedAt: new Date('2026-05-20'),
  },
];

export class SupabaseLocationRepository implements LocationRepository {
  private isSupabaseConfigured(): boolean {
    return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  async findById(id: string): Promise<Location | null> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await (supabase.from('locations') as any)
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) return null;
        const row = data as LocationRow;

        return {
          id: row.id,
          campaignId: row.campaign_id,
          organizationId: row.organization_id,
          name: row.name,
          address: row.address,
          city: row.city,
          assignedSupervisorId: row.assigned_supervisor_id,
          assignedApproverId: row.assigned_approver_id,
          deadline: row.deadline ? new Date(row.deadline) : null,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      } catch {
        // Fall back to memory
      }
    }

    const found = inMemoryLocations.find((l) => l.id === id);
    return found ? { ...found } : null;
  }

  async findByCampaign(campaignId: string): Promise<Location[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await (supabase.from('locations') as any)
          .select('*')
          .eq('campaign_id', campaignId)
          .order('name');

        if (!error && data) {
          return (data as LocationRow[]).map((row) => ({
            id: row.id,
            campaignId: row.campaign_id,
            organizationId: row.organization_id,
            name: row.name,
            address: row.address,
            city: row.city,
            assignedSupervisorId: row.assigned_supervisor_id,
            assignedApproverId: row.assigned_approver_id,
            deadline: row.deadline ? new Date(row.deadline) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          }));
        }
      } catch {
        // Fall back to memory
      }
    }

    return inMemoryLocations.filter((l) => l.campaignId === campaignId);
  }

  async findByOrganization(organizationId: string): Promise<Location[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await (supabase.from('locations') as any)
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return (data as LocationRow[]).map((row) => ({
            id: row.id,
            campaignId: row.campaign_id,
            organizationId: row.organization_id,
            name: row.name,
            address: row.address,
            city: row.city,
            assignedSupervisorId: row.assigned_supervisor_id,
            assignedApproverId: row.assigned_approver_id,
            deadline: row.deadline ? new Date(row.deadline) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          }));
        }
      } catch {
        // Fall back to memory
      }
    }

    return [...inMemoryLocations].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findBySupervisor(supervisorId: string): Promise<Location[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await (supabase.from('locations') as any)
          .select('*')
          .eq('assigned_supervisor_id', supervisorId)
          .order('deadline', { ascending: true });

        if (!error && data) {
          return (data as LocationRow[]).map((row) => ({
            id: row.id,
            campaignId: row.campaign_id,
            organizationId: row.organization_id,
            name: row.name,
            address: row.address,
            city: row.city,
            assignedSupervisorId: row.assigned_supervisor_id,
            assignedApproverId: row.assigned_approver_id,
            deadline: row.deadline ? new Date(row.deadline) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          }));
        }
      } catch {
        // Fall back to memory
      }
    }

    return inMemoryLocations.filter((l) => l.assignedSupervisorId === supervisorId);
  }

  async save(locationInput: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Location> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        if (locationInput.id) {
          const { data, error } = await (supabase.from('locations') as any)
            .update({
              name: locationInput.name,
              address: locationInput.address,
              city: locationInput.city,
              assigned_supervisor_id: locationInput.assignedSupervisorId,
              assigned_approver_id: locationInput.assignedApproverId,
              deadline: locationInput.deadline ? locationInput.deadline.toISOString() : null,
            })
            .eq('id', locationInput.id)
            .select()
            .single();

          if (error) throw new Error(error.message);
          const row = data as LocationRow;
          return {
            id: row.id,
            campaignId: row.campaign_id,
            organizationId: row.organization_id,
            name: row.name,
            address: row.address,
            city: row.city,
            assignedSupervisorId: row.assigned_supervisor_id,
            assignedApproverId: row.assigned_approver_id,
            deadline: row.deadline ? new Date(row.deadline) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          };
        } else {
          const { data, error } = await (supabase.from('locations') as any)
            .insert({
              campaign_id: locationInput.campaignId,
              organization_id: locationInput.organizationId,
              name: locationInput.name,
              address: locationInput.address,
              city: locationInput.city,
              assigned_supervisor_id: locationInput.assignedSupervisorId,
              assigned_approver_id: locationInput.assignedApproverId,
              deadline: locationInput.deadline ? locationInput.deadline.toISOString() : null,
            })
            .select()
            .single();

          if (error) throw new Error(error.message);
          const row = data as LocationRow;
          return {
            id: row.id,
            campaignId: row.campaign_id,
            organizationId: row.organization_id,
            name: row.name,
            address: row.address,
            city: row.city,
            assignedSupervisorId: row.assigned_supervisor_id,
            assignedApproverId: row.assigned_approver_id,
            deadline: row.deadline ? new Date(row.deadline) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    const now = new Date();
    if (locationInput.id) {
      const idx = inMemoryLocations.findIndex((l) => l.id === locationInput.id);
      if (idx !== -1) {
        inMemoryLocations[idx] = {
          ...inMemoryLocations[idx],
          ...locationInput,
          updatedAt: now,
        };
        return inMemoryLocations[idx];
      }
    }

    const newLoc: Location = {
      ...locationInput,
      id: locationInput.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryLocations.push(newLoc);
    return newLoc;
  }

  async bulkSave(locations: Array<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location[]> {
    const created: Location[] = [];
    for (const loc of locations) {
      const res = await this.save(loc);
      created.push(res);
    }
    return created;
  }

  async assignPersonnel(
    locationId: string,
    supervisorId?: string | null,
    approverId?: string | null,
    deadline?: Date | null
  ): Promise<void> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        await (supabase.from('locations') as any).update({
          assigned_supervisor_id: supervisorId,
          assigned_approver_id: approverId,
          deadline: deadline ? deadline.toISOString() : null,
        }).eq('id', locationId);
        return;
      } catch {
        // Fall back to memory
      }
    }

    const loc = inMemoryLocations.find((l) => l.id === locationId);
    if (loc) {
      if (supervisorId !== undefined) loc.assignedSupervisorId = supervisorId;
      if (approverId !== undefined) loc.assignedApproverId = approverId;
      if (deadline !== undefined) loc.deadline = deadline;
      loc.updatedAt = new Date();
    }
  }

  async delete(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = await createServerSupabaseClient();
        await (supabase.from('locations') as any).delete().eq('id', id);
        return;
      } catch {
        // Fall back to memory
      }
    }

    inMemoryLocations = inMemoryLocations.filter((l) => l.id !== id);
  }
}
