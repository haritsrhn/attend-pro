import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const ADMIN_ONLY_PREFIXES = ['/dashboard', '/reports', '/employees'];
const PROTECTED_PREFIXES = [...ADMIN_ONLY_PREFIXES, '/mobile-attendance'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(prefix => path.startsWith(prefix));
  const isAdminRoute = ADMIN_ONLY_PREFIXES.some(prefix => path.startsWith(prefix));

  // PERBAIKAN: Beri tahu middleware bahwa cookie di Vercel itu aman (Secure)
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (isProtected) {
    const token = await getToken({ 
      req, 
      secret: secret,
      secureCookie: isProduction 
    });

    if (!token) {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }

    if (isAdminRoute && token.role === 'STAFF') {
      const url = new URL('/mobile-attendance', req.url);
      return NextResponse.redirect(url);
    }
  }

  if (path === '/login') {
    const token = await getToken({ 
      req, 
      secret: secret,
      secureCookie: isProduction 
    });
    
    if (token) {
      const redirectPath = token.role === 'ADMIN' ? '/dashboard' : '/mobile-attendance';
      const url = new URL(redirectPath, req.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};