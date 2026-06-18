'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const PROTECTED_ROUTES = ['/overview', '/leaves', '/balance', '/settings'];
const ADMIN_ONLY_ROUTES = ['/settings'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !user) {
      // User is not logged in and trying to access protected route -> redirect to login
      router.push('/login');
    } else if (isAdminOnlyRoute && user && user.role !== 'ADMIN' && user.role !== 'LEAD') {
      // User is logged in but not an admin -> redirect to calendar
      router.push('/calendar');
    }
  }, [user, loading, pathname, router]);

  // If loading, show a clean modern spinner using HSL curated colors
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-zinc-100 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-zinc-400">Loading HolidayHQ...</p>
        </div>
      </div>
    );
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route));

  // Prevent flash of content before redirect completes
  if (isProtectedRoute && !user) {
    return null;
  }
  if (isAdminOnlyRoute && user && user.role !== 'ADMIN' && user.role !== 'LEAD') {
    return null;
  }

  return <>{children}</>;
}
