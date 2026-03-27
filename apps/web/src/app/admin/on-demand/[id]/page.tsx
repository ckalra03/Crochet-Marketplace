'use client';

/**
 * Admin On-Demand Request Detail Page -- Full view of a single request with quote management.
 *
 * Shows: request info, buyer info, reference images, existing quotes,
 * QuoteForm to create new quotes, SellerAssignmentSelect to assign a seller.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/feedback/status-badge';
import { QuoteForm } from '@/components/admin/quote-form';
import { SellerAssignmentSelect } from '@/components/admin/seller-assignment-select';
import { useAdminOnDemandRequest, useAssignSeller } from '@/lib/hooks/use-admin';
import { formatMoney, formatDate, formatDateTime } from '@/lib/utils/format';
import { ArrowLeft, Calendar, IndianRupee, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

/** Completed/terminal statuses where quote form should not appear. */
const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'EXPIRED'];

export default function AdminOnDemandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, refetch } = useAdminOnDemandRequest(id);
  const request = data?.request ?? data;

  const assignSeller = useAssignSeller();
  const [selectedSellerId, setSelectedSellerId] = useState('');

  function handleAssignSeller() {
    if (!selectedSellerId) {
      toast.error('Please select a seller first');
      return;
    }
    assignSeller.mutate(
      { requestId: id, sellerProfileId: selectedSellerId },
      {
        onSuccess: () => {
          toast.success('Seller assigned successfully');
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Failed to assign seller');
        },
      },
    );
  }

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Loading request...</p>;
  }

  if (!request) {
    return <p className="text-center py-10 text-muted-foreground">Request not found.</p>;
  }

  const isTerminal = TERMINAL_STATUSES.includes(request.status);
  const quotes = request.quotes ?? [];
  const images = request.referenceImages ?? request.images ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin/on-demand')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to On-Demand Requests
      </Button>

      {/* Request header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Request {request.requestNumber ?? request.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created: {formatDateTime(request.createdAt)}
          </p>
        </div>
        <StatusBadge status={request.status} type="onDemand" />
      </div>

      {/* Request info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm whitespace-pre-wrap">{request.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="text-sm font-medium">
                {request.category?.name ?? 'N/A'}
              </p>
            </div>

            {/* Budget Range */}
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> Budget Range
              </p>
              <p className="text-sm font-medium">
                {request.budgetMinCents || request.budgetMaxCents
                  ? `${request.budgetMinCents ? formatMoney(request.budgetMinCents) : '--'} - ${request.budgetMaxCents ? formatMoney(request.budgetMaxCents) : '--'}`
                  : 'Not specified'}
              </p>
            </div>

            {/* Expected Date */}
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Expected By
              </p>
              <p className="text-sm font-medium">
                {request.expectedBy ? formatDate(request.expectedBy) : 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buyer info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buyer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Name:</span>{' '}
              <span className="font-medium">{request.user?.name ?? 'N/A'}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{' '}
              {request.user?.email ?? 'N/A'}
            </p>
            {request.user?.phone && (
              <p>
                <span className="text-muted-foreground">Phone:</span>{' '}
                {request.user.phone}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reference images */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Reference Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img: any, idx: number) => (
                <a
                  key={idx}
                  href={img.url ?? img}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition"
                >
                  <img
                    src={img.url ?? img}
                    alt={`Reference ${idx + 1}`}
                    className="w-full h-32 object-cover"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Quotes ({quotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quotes yet.</p>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote: any) => (
                <div
                  key={quote.id}
                  className="border rounded-md p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {formatMoney(quote.priceInCents)} -- {quote.estimatedDays} days
                    </p>
                    <StatusBadge
                      status={quote.status ?? 'PENDING'}
                      type="onDemand"
                    />
                  </div>
                  {quote.description && (
                    <p className="text-sm text-muted-foreground">{quote.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {quote.sellerProfile?.businessName && (
                      <span>Seller: {quote.sellerProfile.businessName}</span>
                    )}
                    {quote.validUntil && (
                      <span>Valid until: {formatDateTime(quote.validUntil)}</span>
                    )}
                    <span>Created: {formatDate(quote.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller assignment + Quote form (only for non-terminal requests) */}
      {!isTerminal && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SellerAssignmentSelect
              value={selectedSellerId}
              onChange={setSelectedSellerId}
            />
            {selectedSellerId && (
              <Button
                onClick={handleAssignSeller}
                disabled={assignSeller.isPending}
              >
                {assignSeller.isPending ? 'Assigning...' : 'Assign Selected Seller'}
              </Button>
            )}
          </div>

          <QuoteForm
            requestId={id}
            sellerProfileId={selectedSellerId || undefined}
            onSuccess={() => refetch()}
          />
        </div>
      )}
    </div>
  );
}
