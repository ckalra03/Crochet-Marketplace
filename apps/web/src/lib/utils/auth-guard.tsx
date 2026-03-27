'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
  /** If specified, the user must have this role to access the content */
  role?: 'BUYER' | 'SELLER' | 'ADMIN';
  /** Optional loading/fallback UI shown while checking auth state */
  fallback?: React.ReactNode;
}

/**
 * Return the dashboard path for a given role.
 */
function getDashboardForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'SELLER':
      return '/seller';
    default:
      return '/';
  }
}

/**
 * Client-side route guard that checks Zustand auth state.
 *
 * This complements the edge middleware — middleware handles the initial
 * server-side redirect, while AuthGuard handles client-side navigation
 * and provides a loading state during hydration.
 */
export function AuthGuard({ children, role, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, loadFromStorage } = useAuthStore();

  // Ensure auth state is loaded from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    // Wait for loadFromStorage to populate state
    if (typeof window === 'undefined') return;

    // Not authenticated — redirect to login with current path as redirect param
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Role mismatch — redirect to the user's appropriate dashboard
    if (role && user?.role !== role) {
      router.replace(getDashboardForRole(user?.role ?? 'BUYER'));
    }
  }, [isAuthenticated, user, role, router]);

  // Show fallback while auth state is still loading
  if (!isAuthenticated) {
    return (
      <>
        {fallback ?? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </div>
        )}
      </>
    );
  }

  // Role check — show fallback while redirecting
  if (role && user?.role !== role) {
    return (
      <>
        {fallback ?? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground text-sm">Redirecting...</div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
