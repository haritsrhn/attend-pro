import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

const ADMIN_ONLY_PREFIXES = ['/dashboard', '/reports', '/employees'];
const MOBILE_ATTENDANCE_PREFIX = '/mobile-attendance';

function isPathUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as
      | (typeof req.nextauth.token & {
          role?: 'ADMIN' | 'STAFF';
        })
      | null;

    const isAuthenticated = !!token;
    const role = token?.role;

    const isDashboardRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
      isPathUnder(pathname, prefix),
    );
    const isMobileAttendanceRoute = isPathUnder(
      pathname,
      MOBILE_ATTENDANCE_PREFIX,
    );
    const isLoginRoute = pathname === '/login';

    // Not authenticated and trying to access protected routes
    if (!isAuthenticated && (isDashboardRoute || isMobileAttendanceRoute)) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user visiting /login -> redirect to default page by role
    if (isAuthenticated && isLoginRoute && role) {
      const redirectPath =
        role === 'STAFF' ? MOBILE_ATTENDANCE_PREFIX : '/dashboard';
      const targetUrl = new URL(redirectPath, req.url);
      return NextResponse.redirect(targetUrl);
    }

    // Role-based access control for STAFF on admin-only routes
    if (isAuthenticated && role === 'STAFF' && isDashboardRoute) {
      const targetUrl = new URL(MOBILE_ATTENDANCE_PREFIX, req.url);
      return NextResponse.redirect(targetUrl);
    }

    // ADMIN has unrestricted access; STAFF can access mobile-attendance
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * We always return true here so that the middleware
       * function above runs and we can implement custom
       * redirects for unauthenticated and unauthorized users.
       */
      authorized: () => true,
    },
  },
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/reports/:path*',
    '/employees/:path*',
    '/mobile-attendance/:path*',
    '/login',
  ],
};

