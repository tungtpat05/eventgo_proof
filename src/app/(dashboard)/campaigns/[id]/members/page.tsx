import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { Button } from '@/components/ui/button';
import { MemberManager } from '@/features/campaigns/components/member-manager';
import { SupabaseCampaignMemberRepository } from '@/infrastructure/repositories/supabase-campaign-member-repository';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface MembersPageProps { params: Promise<{ id: string }> }

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

  return (
    <div className="space-y-6">
      <div><Link href={`/campaigns/${id}`}><Button variant="ghost" size="sm">← Quay lại</Button></Link></div>
      <div><h1 className="text-2xl font-bold text-slate-900">Thành viên — {campaign.title}</h1><p className="text-sm text-slate-500">Manager có quyền ngang nhau; hệ thống luôn bảo vệ Manager cuối cùng.</p></div>
      <MemberManager campaignId={id} members={members} invites={invites} />
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-slate-900">Lịch sử thay đổi gần đây</h2>
        <div className="space-y-2 text-xs text-slate-600">
          {history.map((item) => <div key={item.id}>{item.createdAt.toLocaleString('vi-VN')}: {item.previousRole || '—'} / {item.previousStatus || '—'} → {item.newRole || '—'} / {item.newStatus}</div>)}
        </div>
      </div>
    </div>
  );
}
