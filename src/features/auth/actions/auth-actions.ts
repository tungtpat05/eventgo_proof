'use server';

import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { env } from '@/config/env';
import { cookies } from 'next/headers';

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function signInAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
  }

  const cookieStore = await cookies();

  // If Supabase environment is configured, attempt real authentication
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          error: `${error.message}. (Lưu ý: Nếu bạn dùng mật khẩu khác khi tạo user trong Supabase Auth, vui lòng nhập chính xác mật khẩu đó).`,
        };
      }

      if (data?.user) {
        // Clear demo cookie when real auth succeeds
        cookieStore.delete('eventgo_demo_user');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối dịch vụ xác thực Supabase.';
      return { error: message };
    }
  } else {
    // Fallback/Demo mode when Supabase credentials are not yet populated in .env.local
    cookieStore.set('eventgo_demo_user', email, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  // Redirect to dashboard on successful login
  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('eventgo_demo_user');

  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signout network errors
    }
  }
  redirect('/login');
}

