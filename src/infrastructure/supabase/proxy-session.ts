import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/config/env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (!request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login?error=Supabase chưa được cấu hình.', request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/dev-login');

  const isDevSession =
    process.env.NODE_ENV === 'development' && Boolean(request.cookies.get('dev_user_id')?.value);

  if (!user && !isPublicRoute && !isDevSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_system_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.is_system_admin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect /admin routes: only users with is_system_admin = true can enter
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_system_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_system_admin) {
      return NextResponse.redirect(
        new URL('/campaigns/managed?error=Truy cập bị từ chối: Yêu cầu quyền Quản trị viên hệ thống.', request.url)
      );
    }
  }

  return response;
}

