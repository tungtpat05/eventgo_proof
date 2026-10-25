'use server';

import { env } from '@/config/env';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function signInWithGoogleAction(formData?: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const loginHint = formData?.get('login_hint')?.toString();
  const next = formData?.get('next')?.toString() || '/dashboard';

  const callbackUrl = new URL(
    `/auth/callback?next=${encodeURIComponent(next)}`,
    env.NEXT_PUBLIC_APP_URL
  ).toString();

  const queryParams: Record<string, string> = {
    access_type: 'offline',
    prompt: 'select_account',
  };

  if (loginHint) {
    queryParams.login_hint = loginHint;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message || 'Không thể bắt đầu đăng nhập Google.')}`);
  }

  redirect(data.url);
}

export async function switchPersonaViewAction(mode: 'admin' | 'client'): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('eventgo_view_mode', mode, { path: '/', maxAge: 60 * 60 * 24 * 7 });
  if (mode === 'admin') {
    redirect('/admin/dashboard');
  } else {
    redirect('/dashboard');
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const cookieStore = await cookies();
  cookieStore.delete('eventgo_view_mode');
  await supabase.auth.signOut();
  redirect('/login');
}
