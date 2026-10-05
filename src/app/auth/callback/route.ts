import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

  await supabase.rpc('accept_pending_campaign_invites');
  return NextResponse.redirect(new URL(safeNext, request.url));
}
