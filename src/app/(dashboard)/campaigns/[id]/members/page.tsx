import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { Button } from '@/components/ui/button';
import { MemberManager } from '@/features/campaigns/components/member-manager';
import { SupabaseCampaignMemberRepository } from '@/infrastructure/repositories/supabase-campaign-member-repository';
import { createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface MembersPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignMembersPage({ params }: MembersPageProps) {
  const { id } = await params;
  try {
    await requireCampaignManager(id);
  } catch {
    notFound();
  }
  const campaign = await getCampaignDetailsUseCase(id);
  const repo = new SupabaseCampaignMemberRepository();
  const [members, invites, history] = await Promise.all([
    repo.findByCampaign(id),
    repo.findInvitesByCampaign(id),
    repo.findHistoryByCampaign(id),
  ]);

  // Fetch booth assignments to display operational load for each member
  const adminClient = createAdminSupabaseClient();
  const { data: locs } = await adminClient
    .from('locations')
    .select('id, name')
    .eq('campaign_id', id);
  const locIds = (locs || []).map((l) => l.id);
  const locMap = new Map((locs || []).map((l) => [l.id, l.name]));

  let boothRows: any[] = [];
  if (locIds.length > 0) {
    const { data: bData } = await adminClient
      .from('booths')
      .select('id, name, code, location_id')
      .in('location_id', locIds);
    boothRows = bData || [];
  }
  const boothIds = boothRows.map((b) => b.id);
  const boothMap = new Map(boothRows.map((b) => [b.id, b]));

  let supAssignments: any[] = [];
  let appAssignments: any[] = [];
  if (boothIds.length > 0) {
    const [{ data: sData }, { data: aData }] = await Promise.all([
      adminClient.from('booth_supervisor_assignments').select('*').in('booth_id', boothIds),
      adminClient.from('booth_approver_assignments').select('*').in('booth_id', boothIds),
    ]);
    supAssignments = sData || [];
    appAssignments = aData || [];
  }

  const membersWithAssignments = members.map((m) => {
    const assignedBooths: Array<{
      boothId: string;
      boothName: string;
      boothCode?: string | null;
      locationId: string;
      locationName: string;
      role: 'SUPERVISOR' | 'APPROVER';
    }> = [];

    supAssignments
      .filter((s) => s.supervisor_member_id === m.id)
      .forEach((s) => {
        const b = boothMap.get(s.booth_id);
        if (b) {
          assignedBooths.push({
            boothId: b.id,
            boothName: b.name,
            boothCode: b.code,
            locationId: b.location_id,
            locationName: locMap.get(b.location_id) || '',
            role: 'SUPERVISOR',
          });
        }
      });

    appAssignments
      .filter((a) => a.approver_member_id === m.id)
      .forEach((a) => {
        const b = boothMap.get(a.booth_id);
        if (b) {
          assignedBooths.push({
            boothId: b.id,
            boothName: b.name,
            boothCode: b.code,
            locationId: b.location_id,
            locationName: locMap.get(b.location_id) || '',
            role: 'APPROVER',
          });
        }
      });

    return { ...m, assignedBooths };
  });

  const invitesWithAssignments = invites.map((inv) => {
    const assignedBooths: Array<{
      boothId: string;
      boothName: string;
      boothCode?: string | null;
      locationId: string;
      locationName: string;
      role: 'SUPERVISOR' | 'APPROVER';
    }> = [];

    supAssignments
      .filter((s) => s.supervisor_invite_id === inv.id)
      .forEach((s) => {
        const b = boothMap.get(s.booth_id);
        if (b) {
          assignedBooths.push({
            boothId: b.id,
            boothName: b.name,
            boothCode: b.code,
            locationId: b.location_id,
            locationName: locMap.get(b.location_id) || '',
            role: 'SUPERVISOR',
          });
        }
      });

    appAssignments
      .filter((a) => a.approver_invite_id === inv.id)
      .forEach((a) => {
        const b = boothMap.get(a.booth_id);
        if (b) {
          assignedBooths.push({
            boothId: b.id,
            boothName: b.name,
            boothCode: b.code,
            locationId: b.location_id,
            locationName: locMap.get(b.location_id) || '',
            role: 'APPROVER',
          });
        }
      });

    return { ...inv, assignedBooths };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/campaigns/${id}`}>
          <Button variant="ghost" size="sm">
            ← Quay lại
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Thành viên — {campaign.title}</h1>
        <p className="text-sm text-slate-500">
          Manager có quyền ngang nhau; hệ thống luôn bảo vệ Manager cuối cùng.
        </p>
      </div>
      <MemberManager
        campaignId={id}
        members={membersWithAssignments}
        invites={invitesWithAssignments}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-slate-900">Lịch sử thay đổi gần đây</h2>
        <div className="space-y-2 text-xs text-slate-600">
          {history.length === 0 ? (
            <p className="text-slate-400 italic">Chưa có lịch sử thay đổi.</p>
          ) : (
            history.map((item) => (
              <div key={item.id}>
                {item.createdAt.toLocaleString('vi-VN')}: {item.previousRole || '—'} /{' '}
                {item.previousStatus || '—'} → {item.newRole || '—'} / {item.newStatus}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
