'use client';

/**
 * On-Demand Request Detail Page (/on-demand/:id)
 *
 * Shows full request details, status, and -- when quotes exist -- renders
 * QuoteCard components so the buyer can accept or decline.
 * If the request has been accepted, shows a link to the resulting order.
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOnDemandRequest } from '@/lib/hooks/use-on-demand';
import { QuoteCard } from '@/components/on-demand/quote-card';
import { StatusBadge } from '@/components/feedback/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney, formatDate } from '@/lib/utils/format';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft } from 'lucide-react';

/* ─────────── Loading skeleton ─────────── */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-24" />
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/* ─────────── Page ─────────── */

export default function OnDemandDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: request, isLoading, isError } = useOnDemandRequest(id);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Request not found</h2>
        <p className="mt-2 text-muted-foreground">
          This request may have been removed or you don't have access.
        </p>
        <Link href="/on-demand">
          <Button variant="outline" className="mt-4">
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  const categoryName = request.category?.name ?? request.categoryName ?? 'Not specified';
  const quotes: any[] = request.quotes ?? [];
  const hasQuotes = quotes.length > 0;
  const isAccepted = request.status === 'ACCEPTED';

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
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
            <BreadcrumbPage>
              {request.requestNumber ?? `#${id.slice(0, 8)}`}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back link */}
      <Link
        href="/on-demand"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>

      {/* Header row */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {request.requestNumber ?? `Request #${id.slice(0, 8)}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDate(request.createdAt)}
          </p>
        </div>
        <StatusBadge status={request.status} type="order" />
      </div>

      {/* Request details card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap">{request.description}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Category</dt>
              <dd className="mt-1">{categoryName}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Budget Range</dt>
              <dd className="mt-1">
                {request.budgetMinCents != null || request.budgetMaxCents != null
                  ? [
                      request.budgetMinCents != null
                        ? formatMoney(request.budgetMinCents)
                        : '---',
                      request.budgetMaxCents != null
                        ? formatMoney(request.budgetMaxCents)
                        : '---',
                    ].join(' - ')
                  : 'Open budget'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Expected By</dt>
              <dd className="mt-1">
                {request.expectedBy ? formatDate(request.expectedBy) : 'No deadline'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Accepted state -- link to order */}
      {isAccepted && request.orderId && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-green-800">Quote accepted!</p>
              <p className="text-sm text-green-700">
                Your order has been created. Track its progress below.
              </p>
            </div>
            <Link href={`/orders/${request.orderNumber ?? request.orderId}`}>
              <Button size="sm">View Order</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quotes section -- shown when status is QUOTED or when quotes exist */}
      {hasQuotes && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Quotes ({quotes.length})
          </h2>
          <div className="space-y-4">
            {quotes.map((quote: any) => (
              <QuoteCard key={quote.id} requestId={id} quote={quote} />
            ))}
          </div>
        </section>
      )}

      {/* No quotes yet message */}
      {!hasQuotes && request.status === 'SUBMITTED' && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Your request is being reviewed by our artisans.</p>
            <p className="mt-1 text-sm">You'll receive quotes here once sellers respond.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
