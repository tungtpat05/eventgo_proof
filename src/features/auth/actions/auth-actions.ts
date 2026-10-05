'use server';

import { env } from '@/config/env';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const callbackUrl = new URL('/auth/callback', env.NEXT_PUBLIC_APP_URL).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message || 'Không thể bắt đầu đăng nhập Google.')}`);
  }

  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
