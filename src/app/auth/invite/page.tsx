import React from 'react';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { signInWithGoogleAction, signOutAction } from '@/features/auth/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Mail, AlertCircle, ArrowRight, LogOut, Briefcase } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { CampaignRole } from '@/domain/enums';
import { getTranslations } from 'next-intl/server';
import { getRoleLabel } from '@/lib/i18n/enum-presenters';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.invite');
  return {
    title: `${t('campaignInviteTitle')} — EventGo Proof`,
    description: t('systemPlatformSubtitle'),
  };
}

interface InvitePageProps {
  searchParams: Promise<{
    email?: string;
    type?: string;
    campaignId?: string;
    role?: string;
  }>;
}

export default async function InviteAcceptancePage({ searchParams }: InvitePageProps) {
  const t = await getTranslations('auth.invite');
  const tRoles = await getTranslations('roles');

  const { email, type = 'admin', campaignId, role } = await searchParams;
  const normalizedTargetEmail = (email || '').trim().toLowerCase();
  const isCampaignInvite = type === 'campaign' && Boolean(campaignId);

  // Lấy thông tin chiến dịch nếu có
  let campaignTitle = t('defaultCampaignTitle');
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
            <LanguageSwitcher />
          </div>
          <Card className="w-full max-w-md border-amber-200 shadow-xl bg-white">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                {t('invalidEmailTitle')}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                {isCampaignInvite
                  ? t('invalidEmailCampaignDesc')
                  : t('invalidEmailAdminDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p>
                  {t('currentlyLoggedIn', { email: currentEmail })}
                </p>
                <p>
                  {t('invitedEmail', { email: normalizedTargetEmail })}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {t('switchNotice', { email: normalizedTargetEmail })}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <form action={signOutAction} className="w-full">
                <Button type="submit" variant="outline" className="w-full gap-2 border-slate-200">
                  <LogOut className="h-4 w-4" />
                  {t('signOutThisAccount')}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      );
    }
  }

  // 2. Chưa đăng nhập
  const roleDisplay = role && Object.values(CampaignRole).includes(role as CampaignRole)
    ? getRoleLabel(role as CampaignRole, (k: string) => tRoles(k))
    : t('defaultMemberRole');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            {isCampaignInvite ? <Briefcase className="h-7 w-7" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            {isCampaignInvite ? t('campaignInviteTitle') : t('adminInviteTitle')}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            {isCampaignInvite
              ? `${t('campaignLabel', { title: campaignTitle })}${brandName ? ` (${brandName})` : ''}`
              : t('systemPlatformSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {normalizedTargetEmail ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 space-y-1.5 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {t('invitedEmailBadge')}
              </span>
              <div className="flex items-center justify-center gap-2 text-base font-bold text-slate-900">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>{normalizedTargetEmail}</span>
              </div>
              <p className="text-xs text-blue-700/80 pt-1">
                {isCampaignInvite
                  ? t('roleLabel', { role: roleDisplay })
                  : t('adminPermission')}
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-600">
              {t('genericInvite')}
            </p>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">{t('instructionsTitle')}</p>
            <p>{t('step1')}</p>
            <p>{t('step2', { email: normalizedTargetEmail || t('step2Default') })}</p>
            <p>{t('step3')}</p>
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
              <span>{t('acceptButton')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
