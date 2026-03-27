'use client';

/**
 * Admin Dispute Detail Page -- Full view of a single dispute.
 *
 * Shows: dispute info, raised by / against, evidence images,
 * resolution form (for OPEN/INVESTIGATING status), and resolution
 * summary if already resolved.
 */

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/feedback/status-badge';
import { EvidenceGallery } from '@/components/admin/evidence-gallery';
import { ResolutionForm } from '@/components/admin/resolution-form';
import { useAdminDisputes } from '@/lib/hooks/use-admin';
import { formatDateTime } from '@/lib/utils/format';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const { data, isLoading, refetch } = useAdminDisputes();
  const disputes: any[] = data?.disputes ?? data ?? [];
  const dispute = disputes.find((d: any) => d.id === disputeId);

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Loading dispute...</p>;
  }

  if (!dispute) {
    return <p className="text-center py-10 text-muted-foreground">Dispute not found.</p>;
  }

  const canResolve = ['OPEN', 'INVESTIGATING'].includes(dispute.status);
  const isResolved = ['RESOLVED', 'CLOSED'].includes(dispute.status);
  const evidenceImages: string[] = dispute.evidenceImages ?? dispute.images ?? [];

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
              <Link href="/admin/disputes">Disputes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{dispute.disputeNumber ?? disputeId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Dispute header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Dispute {dispute.disputeNumber ?? disputeId}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created: {formatDateTime(dispute.createdAt)}
          </p>
        </div>
        <StatusBadge status={dispute.status} type="dispute" />
      </div>

      {/* Dispute info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dispute Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Type:</span>{' '}
            <span className="font-medium">{dispute.type?.replace(/_/g, ' ') ?? 'N/A'}</span>
          </p>
          {dispute.description && (
            <p>
              <span className="text-muted-foreground">Description:</span>{' '}
              {dispute.description}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Status:</span>{' '}
            <StatusBadge status={dispute.status} type="dispute" />
          </p>
          <p>
            <span className="text-muted-foreground">Order:</span>{' '}
            <Link
              href={`/admin/orders/${dispute.order?.orderNumber ?? dispute.orderNumber ?? ''}`}
              className="font-mono text-primary hover:underline"
            >
              {dispute.order?.orderNumber ?? dispute.orderNumber ?? 'N/A'}
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Raised by */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raised By</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Buyer:</span>{' '}
            {dispute.user?.name ?? dispute.raisedByName ?? 'N/A'}
          </p>
          {dispute.user?.email && (
            <p>
              <span className="text-muted-foreground">Email:</span>{' '}
              {dispute.user.email}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Against seller (if applicable) */}
      {(dispute.sellerProfile || dispute.againstSellerName) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Against Seller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Seller:</span>{' '}
              {dispute.sellerProfile?.businessName ?? dispute.againstSellerName ?? 'N/A'}
            </p>
            {dispute.sellerProfile?.user?.email && (
              <p>
                <span className="text-muted-foreground">Email:</span>{' '}
                {dispute.sellerProfile.user.email}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evidence images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <EvidenceGallery images={evidenceImages} />
        </CardContent>
      </Card>

      {/* Resolution form (for open/investigating disputes) */}
      {canResolve && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolve Dispute</CardTitle>
          </CardHeader>
          <CardContent>
            <ResolutionForm
              disputeId={dispute.id}
              onSuccess={() => refetch()}
            />
          </CardContent>
        </Card>
      )}

      {/* Resolution summary (for resolved/closed disputes) */}
      {isResolved && dispute.resolutionSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="whitespace-pre-wrap">{dispute.resolutionSummary}</p>
            {dispute.resolvedAt && (
              <p className="text-muted-foreground">
                Resolved: {formatDateTime(dispute.resolvedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
