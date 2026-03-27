'use client';

/**
 * Admin Seller Detail / Review Page
 * Shows full seller profile, bank details (masked), portfolio, commission rate,
 * approval history, and action panel for pending/approved sellers.
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { SellerReviewActions } from '@/components/admin/seller-review-actions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAdminSeller } from '@/lib/hooks/use-admin';
import { formatDate, formatDateTime } from '@/lib/utils/format';

/* ─── Helper: mask bank account number ─── */

function maskAccount(value?: string | null): string {
  if (!value) return '-';
  if (value.length <= 4) return value;
  return '*'.repeat(value.length - 4) + value.slice(-4);
}

/* ─── Page component ─── */

export default function AdminSellerDetailPage() {
  const params = useParams<{ id: string }>();
  const sellerId = params.id;
  const { data: seller, isLoading } = useAdminSeller(sellerId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Seller not found.
      </div>
    );
  }

  const breadcrumbs = (
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
            <Link href="/admin/sellers">Sellers</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{seller.businessName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={seller.businessName}
        description={`Seller application from ${seller.user?.name ?? 'Unknown'}`}
        breadcrumbs={breadcrumbs}
        actions={
          (seller.status === 'PENDING' || seller.status === 'APPROVED') ? (
            <SellerReviewActions sellerId={sellerId} status={seller.status} />
          ) : undefined
        }
      />

      {/* Status overview */}
      <div className="flex items-center gap-4">
        <StatusBadge status={seller.status} type="seller" />
        <span className="text-sm text-muted-foreground">
          Applied: {formatDate(seller.createdAt)}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Business Name" value={seller.businessName} />
            <InfoRow label="Description" value={seller.description || '-'} />
            <InfoRow label="Applicant Name" value={seller.user?.name ?? '-'} />
            <InfoRow label="Email" value={seller.user?.email ?? '-'} />
            <InfoRow label="Phone" value={seller.phone || seller.user?.phone || '-'} />
            <InfoRow label="Address" value={seller.address || '-'} />
            <InfoRow label="GSTIN" value={seller.gstin || '-'} />
          </CardContent>
        </Card>

        {/* Bank Details (masked) */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Bank Name" value={seller.bankName || '-'} />
            <InfoRow label="Account Holder" value={seller.accountHolderName || '-'} />
            <InfoRow label="Account Number" value={maskAccount(seller.bankAccountNumber)} />
            <InfoRow label="IFSC Code" value={seller.ifscCode || '-'} />
            <InfoRow label="UPI ID" value={seller.upiId || '-'} />
          </CardContent>
        </Card>

        {/* Commission */}
        <Card>
          <CardHeader>
            <CardTitle>Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Commission Rate"
              value={
                seller.commissionRate != null
                  ? `${(seller.commissionRate * 100).toFixed(1)}%`
                  : 'Default'
              }
            />
          </CardContent>
        </Card>

        {/* Approval History */}
        <Card>
          <CardHeader>
            <CardTitle>Approval History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {seller.approvedAt && (
              <InfoRow label="Approved" value={formatDateTime(seller.approvedAt)} />
            )}
            {seller.approvedBy && (
              <InfoRow
                label="Approved By"
                value={seller.approvedBy?.name || seller.approvedBy?.email || seller.approvedById || '-'}
              />
            )}
            {seller.rejectedAt && (
              <InfoRow label="Rejected" value={formatDateTime(seller.rejectedAt)} />
            )}
            {seller.rejectedBy && (
              <InfoRow
                label="Rejected By"
                value={seller.rejectedBy?.name || seller.rejectedBy?.email || seller.rejectedById || '-'}
              />
            )}
            {seller.rejectionReason && (
              <InfoRow label="Rejection Reason" value={seller.rejectionReason} />
            )}
            {seller.suspendedAt && (
              <InfoRow label="Suspended" value={formatDateTime(seller.suspendedAt)} />
            )}
            {seller.suspensionReason && (
              <InfoRow label="Suspension Reason" value={seller.suspensionReason} />
            )}
            {!seller.approvedAt && !seller.rejectedAt && !seller.suspendedAt && (
              <p className="text-sm text-muted-foreground">No approval actions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Images */}
      {seller.portfolioImages && seller.portfolioImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {seller.portfolioImages.map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                  <Image
                    src={img}
                    alt={`Portfolio ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Info row helper ─── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
