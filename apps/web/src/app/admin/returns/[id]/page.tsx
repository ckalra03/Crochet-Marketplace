'use client';

/**
 * Admin Return Detail Page -- Full view of a single return request.
 *
 * Shows: return info, order/item info, evidence images, review form
 * (for REQUESTED/UNDER_REVIEW status), and resolution info if already resolved.
 */

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/feedback/status-badge';
import { EvidenceGallery } from '@/components/admin/evidence-gallery';
import { ReturnReviewForm } from '@/components/admin/return-review-form';
import { useAdminReturns } from '@/lib/hooks/use-admin';
import { formatDate, formatDateTime, formatMoney } from '@/lib/utils/format';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function AdminReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;

  const { data, isLoading, refetch } = useAdminReturns();
  const returns: any[] = data?.returns ?? data ?? [];
  const returnItem = returns.find((r: any) => r.id === returnId);

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Loading return...</p>;
  }

  if (!returnItem) {
    return <p className="text-center py-10 text-muted-foreground">Return not found.</p>;
  }

  const canReview = ['REQUESTED', 'UNDER_REVIEW'].includes(returnItem.status);
  const isResolved = ['APPROVED', 'REJECTED', 'REFUNDED'].includes(returnItem.status);
  const evidenceImages: string[] = returnItem.evidenceImages ?? returnItem.images ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/returns">Returns</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{returnItem.returnNumber ?? returnId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Return header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Return {returnItem.returnNumber ?? returnId}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created: {formatDateTime(returnItem.createdAt)}
          </p>
        </div>
        <StatusBadge status={returnItem.status} type="return" />
      </div>

      {/* Return info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Return Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Reason:</span>{' '}
            <span className="font-medium">{returnItem.reason}</span>
          </p>
          {returnItem.description && (
            <p>
              <span className="text-muted-foreground">Description:</span>{' '}
              {returnItem.description}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Status:</span>{' '}
            <StatusBadge status={returnItem.status} type="return" />
          </p>
        </CardContent>
      </Card>

      {/* Order / item info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Order Number:</span>{' '}
            <Link
              href={`/admin/orders/${returnItem.order?.orderNumber ?? returnItem.orderNumber ?? ''}`}
              className="font-mono text-primary hover:underline"
            >
              {returnItem.order?.orderNumber ?? returnItem.orderNumber ?? 'N/A'}
            </Link>
          </p>
          {returnItem.user && (
            <p>
              <span className="text-muted-foreground">Buyer:</span>{' '}
              {returnItem.user.name} ({returnItem.user.email})
            </p>
          )}
          {returnItem.orderItem && (
            <>
              <p>
                <span className="text-muted-foreground">Product:</span>{' '}
                {returnItem.orderItem.product?.name ?? returnItem.orderItem.productName ?? 'N/A'}
              </p>
              <p>
                <span className="text-muted-foreground">Quantity:</span>{' '}
                {returnItem.orderItem.quantity ?? 'N/A'}
              </p>
              {returnItem.orderItem.priceInCents != null && (
                <p>
                  <span className="text-muted-foreground">Item Price:</span>{' '}
                  {formatMoney(returnItem.orderItem.priceInCents)}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Evidence images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidence Images</CardTitle>
        </CardHeader>
        <CardContent>
          <EvidenceGallery images={evidenceImages} />
        </CardContent>
      </Card>

      {/* Review form (for pending returns) */}
      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Return</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnReviewForm
              returnId={returnItem.id}
              onSuccess={() => refetch()}
            />
          </CardContent>
        </Card>
      )}

      {/* Resolution info (for resolved returns) */}
      {isResolved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Decision:</span>{' '}
              <span className="font-medium">
                {returnItem.decision ?? returnItem.resolutionType ?? returnItem.status}
              </span>
            </p>
            {returnItem.refundAmountCents != null && (
              <p>
                <span className="text-muted-foreground">Refund Amount:</span>{' '}
                {formatMoney(returnItem.refundAmountCents)}
              </p>
            )}
            {returnItem.adminNotes && (
              <p>
                <span className="text-muted-foreground">Admin Notes:</span>{' '}
                {returnItem.adminNotes}
              </p>
            )}
            {returnItem.resolvedAt && (
              <p>
                <span className="text-muted-foreground">Resolved:</span>{' '}
                {formatDateTime(returnItem.resolvedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
