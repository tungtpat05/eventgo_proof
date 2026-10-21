import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development mode' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'a3f3cad5-0eaf-452f-a006-264bb4732562';
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set('dev_user_id', userId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
