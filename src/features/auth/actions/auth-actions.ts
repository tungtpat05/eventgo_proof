'use server';

import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { env } from '@/config/env';

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function signInAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
  }

  // If Supabase environment is configured, attempt real authentication
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message || 'Email hoặc mật khẩu không chính xác.' };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối dịch vụ xác thực.';
      return { error: message };
    }
  }

  // Redirect to dashboard on successful login
  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  redirect('/login');
}
