import React from 'react';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { signInWithGoogleAction, signOutAction } from '@/features/auth/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Mail, AlertCircle, ArrowRight, LogOut, Briefcase } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { CampaignRole } from '@/domain/enums';

export const metadata: Metadata = {
  title: 'Chấp Nhận Lời Mời — EventGo Proof',
  description: 'Tham gia vận hành và quản lý trên EventGo Proof',
};

interface InvitePageProps {
  searchParams: Promise<{
    email?: string;
    type?: string;
    campaignId?: string;
    role?: string;
  }>;
}

export default async function InviteAcceptancePage({ searchParams }: InvitePageProps) {
  const { email, type = 'admin', campaignId, role } = await searchParams;
  const normalizedTargetEmail = (email || '').trim().toLowerCase();
  const isCampaignInvite = type === 'campaign' && Boolean(campaignId);

  // Lấy thông tin chiến dịch nếu có
  let campaignTitle = 'Chiến dịch';
  let brandName = '';
  if (isCampaignInvite && campaignId) {
    const adminClient = createAdminSupabaseClient();
    const { data: campaign } = await adminClient
      .from('campaigns')
      .select('title, brand_name')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaign) {
      campaignTitle = campaign.title;
      brandName = campaign.brand_name || '';
    }
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentEmail = user?.email?.toLowerCase();

  const destinationUrl = isCampaignInvite ? `/campaigns/${campaignId}` : '/admin/dashboard';

  // 1. Người dùng đã đăng nhập sẵn
  if (user && currentEmail) {
    if (normalizedTargetEmail && currentEmail === normalizedTargetEmail) {
      if (isCampaignInvite) {
        await supabase.rpc('accept_pending_campaign_invites');
        redirect(destinationUrl);
      } else {
        await supabase.rpc('accept_pending_admin_invites');
        redirect('/admin/dashboard');
      }
    }

    // Đang đăng nhập email khác với email nhận lời mời
    if (normalizedTargetEmail && currentEmail !== normalizedTargetEmail) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-amber-200 shadow-xl bg-white">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Tài khoản không khớp
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                {isCampaignInvite
                  ? 'Lời mời tham gia chiến dịch được gửi riêng cho email khác'
                  : 'Lời mời quản trị viên được gửi riêng cho email khác'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p>
                  Đang đăng nhập: <strong className="text-slate-800">{currentEmail}</strong>
                </p>
                <p>
                  Email nhận lời mời: <strong className="text-blue-600">{normalizedTargetEmail}</strong>
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Để kích hoạt quyền và vào chiến dịch, bạn cần đăng xuất và đăng nhập lại bằng tài khoản Google{' '}
                <strong>{normalizedTargetEmail}</strong>.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <form action={signOutAction} className="w-full">
                <Button type="submit" variant="outline" className="w-full gap-2 border-slate-200">
                  <LogOut className="h-4 w-4" />
                  Đăng xuất tài khoản này
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      );
    }
  }

  // 2. Chưa đăng nhập
  const roleDisplay = role === CampaignRole.SUPERVISOR
    ? 'Giám sát viên hiện trường (Supervisor)'
    : role === CampaignRole.APPROVER
    ? 'Người phê duyệt nghiệm thu (Approver)'
    : role === CampaignRole.MANAGER
    ? 'Quản lý chiến dịch (Manager)'
    : 'Thành viên chiến dịch';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            {isCampaignInvite ? <Briefcase className="h-7 w-7" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            {isCampaignInvite ? 'Lời Mời Tham Gia Chiến Dịch' : 'Lời Mời Quản Trị Viên'}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            {isCampaignInvite
              ? `Chiến dịch: ${campaignTitle}${brandName ? ` (${brandName})` : ''}`
              : 'Nền tảng kiểm soát và nghiệm thu chiến dịch EventGo Proof'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {normalizedTargetEmail ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 space-y-1.5 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Email nhận lời mời
              </span>
              <div className="flex items-center justify-center gap-2 text-base font-bold text-slate-900">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>{normalizedTargetEmail}</span>
              </div>
              <p className="text-xs text-blue-700/80 pt-1">
                {isCampaignInvite
                  ? `Vai trò: ${roleDisplay}`
                  : 'Quyền hạn: System Administrator (Toàn quyền quản trị & Gói PRO)'}
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-600">
              Bạn nhận được lời mời tham gia hệ thống. Vui lòng đăng nhập bằng tài khoản Google được mời để kích hoạt.
            </p>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Hướng dẫn kích hoạt:</p>
            <p>1. Nhấn nút "Tiếp tục với Google" bên dưới.</p>
            <p>2. Đăng nhập bằng tài khoản <strong>{normalizedTargetEmail || 'được mời'}</strong>.</p>
            <p>3. Hệ thống sẽ tự động kích hoạt quyền và đưa bạn vào không gian làm việc.</p>
          </div>
        </CardContent>
        <CardFooter className="pb-8">
          <form action={signInWithGoogleAction} className="w-full space-y-2">
            {normalizedTargetEmail && (
              <input type="hidden" name="login_hint" value={normalizedTargetEmail} />
            )}
            <input type="hidden" name="next" value={destinationUrl} />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-md shadow-blue-500/20 gap-2 cursor-pointer"
            >
              <span>Tiếp tục với Google</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
