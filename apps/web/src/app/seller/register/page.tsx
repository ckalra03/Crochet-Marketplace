'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { RegistrationWizard } from '@/components/seller/registration-wizard';
import { OTPVerification } from '@/components/checkout/otp-verification';
import { ChevronRight } from 'lucide-react';

/**
 * Seller registration page — open to everyone.
 *
 * Access rules:
 * - Guests: shown OTP verification first → auto-registered as buyer → then wizard
 * - Authenticated BUYER: shown wizard directly
 * - Existing sellers: redirected to /seller dashboard
 * - Admin: redirected to /admin
 *
 * All seller registrations require admin approval before the seller
 * can list products or access the seller dashboard.
 */
export default function SellerRegisterPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect existing sellers to the seller dashboard
    if (isAuthenticated && user?.sellerProfile) {
      router.replace('/seller');
      return;
    }

    // Redirect admin to admin dashboard
    if (isAuthenticated && user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [isAuthenticated, user, router]);

  // Existing seller — show nothing while redirecting
  if (isAuthenticated && user?.sellerProfile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
        Join Crochet Hub as a seller and showcase your handmade crochet products
        to thousands of buyers. All applications are reviewed by our team.
      </p>

      {/* Guest users: verify identity first via OTP */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto">
          <p className="text-sm text-muted-foreground text-center mb-4">
            First, verify your email to create your account.
          </p>
          <OTPVerification />
        </div>
      ) : (
        /* Authenticated users: show seller registration wizard */
        <RegistrationWizard />
      )}
    </div>
  );
}
