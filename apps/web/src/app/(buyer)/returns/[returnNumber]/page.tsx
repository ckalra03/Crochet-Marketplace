'use client';

/**
 * Return detail page -- Shows full details of a single return request.
 *
 * Uses useReturn(returnNumber) hook.
 * Displays status badge, timeline, return details, evidence, and resolution info.
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useReturn } from '@/lib/hooks/use-returns';
import { StatusBadge } from '@/components/feedback/status-badge';
import { Timeline, type TimelineStep } from '@/components/feedback/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatMoney, getStatusLabel } from '@/lib/utils/format';
import { ArrowLeft, ImageIcon } from 'lucide-react';

/* ───────────── Timeline builder ───────────── */

/** Ordered return statuses for the timeline */
const RETURN_STEPS = ['REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED'] as const;

/**
 * Build timeline steps from the current return status.
 * REJECTED and CANCELLED are terminal states shown separately.
 */
function buildTimeline(status: string, returnData: any): TimelineStep[] {
  // Handle terminal states
  if (status === 'REJECTED') {
    return [
      { label: 'Requested', status: 'completed', date: returnData.createdAt ? formatDate(returnData.createdAt) : undefined },
      { label: 'Rejected', status: 'current', description: returnData.adminNotes ?? 'Return request was rejected.', date: returnData.updatedAt ? formatDate(returnData.updatedAt) : undefined },
    ];
  }
  if (status === 'CANCELLED') {
    return [
      { label: 'Requested', status: 'completed', date: returnData.createdAt ? formatDate(returnData.createdAt) : undefined },
      { label: 'Cancelled', status: 'current', date: returnData.updatedAt ? formatDate(returnData.updatedAt) : undefined },
    ];
  }

  const currentIndex = RETURN_STEPS.indexOf(status as any);

  return RETURN_STEPS.map((step, i) => ({
    label: getStatusLabel(step),
    status: i < currentIndex ? 'completed' as const : i === currentIndex ? 'current' as const : 'upcoming' as const,
    date: i === 0 && returnData.createdAt ? formatDate(returnData.createdAt) : undefined,
  }));
}

/* ───────────── Loading skeleton ───────────── */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <Card>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-muted animate-pulse" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────────── Page ───────────── */

export default function ReturnDetailPage() {
  const params = useParams();
  const returnNumber = params.returnNumber as string;
  const { data: returnData, isLoading, isError } = useReturn(returnNumber);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !returnData) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-muted-foreground">Return not found or an error occurred.</p>
        <Link href="/returns" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Back to returns
        </Link>
      </div>
    );
  }

  const timelineSteps = buildTimeline(returnData.status, returnData);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/returns"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to returns
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{returnData.returnNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted on {formatDate(returnData.createdAt)}
            {returnData.orderNumber && ` · Order ${returnData.orderNumber}`}
          </p>
        </div>
        <StatusBadge status={returnData.status} type="return" className="text-sm" />
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Return Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline steps={timelineSteps} />
        </CardContent>
      </Card>

      {/* Return details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Return Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reason */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Reason</p>
            <p className="text-sm">{getStatusLabel(returnData.reason)}</p>
          </div>

          {/* Description */}
          {returnData.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{returnData.description}</p>
            </div>
          )}

          {/* Product info */}
          {returnData.productName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product</p>
              <p className="text-sm">{returnData.productName}</p>
            </div>
          )}

          {/* Evidence images */}
          {returnData.evidenceImages && returnData.evidenceImages.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Evidence</p>
              <div className="flex flex-wrap gap-2">
                {returnData.evidenceImages.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted"
                    title={img}
                  >
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution info (shown if resolved) */}
      {(returnData.status === 'REFUNDED' || returnData.refundAmountInCents || returnData.adminNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {returnData.refundAmountInCents != null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Refund Amount</p>
                <p className="text-lg font-bold text-green-700">
                  {formatMoney(returnData.refundAmountInCents)}
                </p>
              </div>
            )}
            {returnData.adminNotes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Notes</p>
                <p className="text-sm">{returnData.adminNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
