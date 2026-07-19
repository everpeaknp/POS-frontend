import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/erp', '/settings'];

// Module-based route protection mapping
const moduleRoutes: Record<string, string> = {
  '/dashboard/sales': 'sales',
  '/dashboard/purchase': 'purchase',
  '/dashboard/inventory': 'inventory',
  '/dashboard/accounting': 'accounting',
  '/dashboard/construction': 'construction',
  '/dashboard/hardware': 'hardware',
  '/dashboard/hr': 'hr',
  '/dashboard/pos': 'pos',
  '/dashboard/reports': 'reports',
  '/dashboard/settings': 'settings',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  const isProtectedRoute = !isPublicRoute && protectedRoutes.some(route => pathname.startsWith(route));

  // Get token from cookies (Next.js automatically handles httpOnly cookies)
  const token = request.cookies.get('access_token')?.value;

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth routes with a session cookie, send to ERP.
  // Skip when a redirect= query is present (post-logout / explicit auth return)
  // to avoid bounce loops with client auth hydration.
  if (isPublicRoute && token && pathname.startsWith('/auth/')) {
    const hasExplicitRedirect = request.nextUrl.searchParams.has('redirect');
    if (!hasExplicitRedirect) {
      return NextResponse.redirect(new URL('/erp', request.url));
    }
  }

  // Module-based route protection
  // Note: This is a basic check. Full validation happens on the backend.
  // The frontend will also check permissions via usePermissions hook.
  // This middleware just provides an early redirect for better UX.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
