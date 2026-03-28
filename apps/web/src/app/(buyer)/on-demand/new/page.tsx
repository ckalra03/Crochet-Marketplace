'use client';

/**
 * New On-Demand Request Page (/on-demand/new)
 *
 * Guests can access this page. If not authenticated, an OTP verification
 * form is shown first. After verification the guest is auto-registered
 * and the form becomes usable.
 *
 * Renders the multi-step RequestFormWizard with breadcrumb navigation
 * and a page header.
 */

import Link from 'next/link';
import { RequestFormWizard } from '@/components/on-demand/request-form-wizard';
import { OTPVerification } from '@/components/checkout/otp-verification';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function NewOnDemandPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/on-demand">On-Demand</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Request</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page header */}
      <h1 className="mb-8 text-2xl font-bold">Create a Custom Request</h1>

      {/* Guest flow: show OTP verification before the form */}
      {!isAuthenticated ? (
        <div className="mb-8">
          <p className="text-muted-foreground mb-6 text-center">
            Please verify your email to submit a custom crochet request.
          </p>
          <OTPVerification
            title="Verify to Submit Request"
            description="Enter your email and verify with OTP to create your custom order."
          />
        </div>
      ) : (
        /* Authenticated: show the wizard form */
        <RequestFormWizard />
      )}
    </div>
  );
}
