'use client';

/**
 * New Return page -- Form for submitting a return request.
 *
 * Reads orderId and orderItemId from URL search params if provided
 * (e.g. /returns/new?orderId=ORD-001&orderItemId=abc123).
 * Includes breadcrumb navigation.
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ReturnForm } from '@/components/returns/return-form';
import { ChevronRight } from 'lucide-react';

function NewReturnContent() {
  const searchParams = useSearchParams();

  // Read optional pre-selection from URL
  const orderNumber = searchParams.get('orderId') ?? undefined;
  const orderItemId = searchParams.get('orderItemId') ?? undefined;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/returns" className="hover:text-foreground">
          Returns
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">New Return Request</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">Submit a Return Request</h1>

      <ReturnForm orderNumber={orderNumber} orderItemId={orderItemId} />
    </div>
  );
}

export default function NewReturnPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-2xl px-4 py-8">Loading...</div>}>
      <NewReturnContent />
    </Suspense>
  );
}
