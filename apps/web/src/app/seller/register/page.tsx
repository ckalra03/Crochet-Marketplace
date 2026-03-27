'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { RegistrationWizard } from '@/components/seller/registration-wizard';
import { ChevronRight } from 'lucide-react';

/**
 * Seller registration page.
 *
 * Access rules:
 * - Unauthenticated visitors are redirected to /login.
 * - Users who already have a seller profile are redirected to /seller (dashboard).
 * - Only authenticated BUYER users without an existing seller profile can access the wizard.
 */
export default function SellerRegisterPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect unauthenticated visitors to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Redirect existing sellers to the seller dashboard
    if (user?.sellerProfile) {
      router.replace('/seller');
      return;
    }

    // Redirect non-buyer roles (e.g. ADMIN) — only BUYER can register as seller
    if (user?.role && user.role !== 'BUYER') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  // Guard: show nothing while redirecting
  if (!isAuthenticated || !user || user.sellerProfile || user.role !== 'BUYER') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Become a Seller</span>
      </nav>

      {/* Page heading */}
      <h1 className="text-2xl font-bold mb-2">Become a Seller</h1>
      <p className="text-muted-foreground mb-8">
        Complete the steps below to apply for a seller account on Crochet Hub.
      </p>

      {/* Registration wizard */}
      <RegistrationWizard />
    </div>
  );
}
