'use client';

/**
 * QuoteCard -- Displays a seller's quote on an on-demand request.
 *
 * Shows price, estimated days, description, and a countdown to expiry.
 * Provides "Accept & Pay" and "Decline" actions when the quote is pending.
 * Uses ConfirmationDialog before declining.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/feedback/status-badge';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import { useAcceptQuote, useRejectQuote } from '@/lib/hooks/use-on-demand';
import { formatMoney } from '@/lib/utils/format';
import { Clock } from 'lucide-react';

interface QuoteCardProps {
  requestId: string;
  quote: {
    id: string;
    priceCents: number;
    estimatedDays: number;
    description?: string;
    status: string;           // PENDING, ACCEPTED, REJECTED, EXPIRED
    expiresAt?: string | null;
    seller?: { businessName?: string } | null;
  };
}

/* ─────────── Simple countdown helper ─────────── */

function useCountdown(expiresAt?: string | null) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    function tick() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expired');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      setRemaining(parts.join(' '));
    }

    tick();
    const interval = setInterval(tick, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}

/* ─────────── Component ─────────── */

export function QuoteCard({ requestId, quote }: QuoteCardProps) {
  const acceptMutation = useAcceptQuote();
  const rejectMutation = useRejectQuote();
  const countdown = useCountdown(quote.expiresAt);

  const isPending = quote.status === 'PENDING';
  const isExpired = quote.status === 'EXPIRED' || countdown === 'Expired';

  function handleAccept() {
    acceptMutation.mutate({ requestId, quoteId: quote.id });
  }

  function handleReject() {
    rejectMutation.mutate({ requestId, quoteId: quote.id });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">
          {quote.seller?.businessName ?? 'Seller Quote'}
        </CardTitle>
        {/* Show status badge for non-pending quotes */}
        {!isPending && <StatusBadge status={quote.status} type="order" />}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price & estimated days */}
        <div className="flex items-baseline gap-4">
          <span className="text-2xl font-bold">{formatMoney(quote.priceCents)}</span>
          <span className="text-sm text-muted-foreground">
            ~{quote.estimatedDays} day{quote.estimatedDays !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Description */}
        {quote.description && (
          <p className="text-sm text-muted-foreground">{quote.description}</p>
        )}

        {/* Countdown to expiry */}
        {quote.expiresAt && (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={isExpired ? 'text-red-500' : 'text-muted-foreground'}>
              {isExpired ? 'Quote expired' : `Expires in ${countdown}`}
            </span>
          </div>
        )}

        {/* Action buttons (only for pending, non-expired quotes) */}
        {isPending && !isExpired && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? 'Accepting...' : 'Accept & Pay'}
            </Button>

            <ConfirmationDialog
              title="Decline Quote"
              description="Are you sure you want to decline this quote? This action cannot be undone."
              confirmLabel="Decline"
              variant="destructive"
              onConfirm={handleReject}
            >
              <Button
                variant="outline"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Declining...' : 'Decline'}
              </Button>
            </ConfirmationDialog>
          </div>
        )}

        {/* Error feedback */}
        {(acceptMutation.isError || rejectMutation.isError) && (
          <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
