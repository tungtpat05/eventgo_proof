import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPlanTier, SubscriptionStatus } from '@/domain/enums';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') || '/dashboard';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=Thiếu mã xác thực Google.', request.url));
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (
    error
    || !data.user?.email
    || !data.user.email_confirmed_at
    || data.user.app_metadata.provider !== 'google'
  ) {
    const message = encodeURIComponent(error?.message || 'Không thể hoàn tất đăng nhập Google.');
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL(`/login?error=${message}`, request.url));
  }

  const metadata = data.user.user_metadata;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email: data.user.email.toLowerCase(),
    full_name: String(metadata.full_name || metadata.name || data.user.email),
    avatar_url: metadata.avatar_url || metadata.picture || null,
  });

  if (profileError) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=Không thể khởi tạo hồ sơ người dùng.', request.url));
  }

  // Accept pending invites (campaign and admin)
  await Promise.allSettled([
    supabase.rpc('accept_pending_campaign_invites'),
    supabase.rpc('accept_pending_admin_invites'),
  ]);

  // Ensure user has at least a FREE subscription row
  await supabase.from('subscriptions').upsert(
    {
      user_id: data.user.id,
      plan: SubscriptionPlanTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      started_at: new Date().toISOString(),
    },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );

  return NextResponse.redirect(new URL(safeNext, request.url));
}

