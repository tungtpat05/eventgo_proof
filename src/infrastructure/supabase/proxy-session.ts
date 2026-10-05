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
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/auth/callback');

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return response;
}
