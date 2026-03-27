'use client';

/**
 * QuoteForm -- Admin form to create a quote for an on-demand request.
 *
 * Features:
 * - Price input in INR (auto-converts to cents for API)
 * - Estimated days input
 * - Validity period (default 72 hours or custom date)
 * - Description/notes textarea
 * - Uses useCreateQuote() mutation with toast feedback
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateQuote } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';

interface QuoteFormProps {
  requestId: string;
  sellerProfileId?: string;
  onSuccess?: () => void;
}

function QuoteForm({ requestId, sellerProfileId, onSuccess }: QuoteFormProps) {
  const [priceRupees, setPriceRupees] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [validityMode, setValidityMode] = useState<'default' | 'custom'>('default');
  const [customHours, setCustomHours] = useState('72');
  const [description, setDescription] = useState('');

  const createQuote = useCreateQuote();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const price = parseFloat(priceRupees);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const days = parseInt(estimatedDays, 10);
    if (isNaN(days) || days <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }

    const validityHours =
      validityMode === 'custom' ? parseInt(customHours, 10) : 72;

    if (isNaN(validityHours) || validityHours <= 0) {
      toast.error('Please enter a valid validity period');
      return;
    }

    const priceInCents = Math.round(price * 100);

    createQuote.mutate(
      {
        requestId,
        data: {
          priceInCents,
          estimatedDays: days,
          description: description.trim() || undefined,
          validityHours,
          sellerProfileId: sellerProfileId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Quote created successfully');
          setPriceRupees('');
          setEstimatedDays('');
          setDescription('');
          setValidityMode('default');
          setCustomHours('72');
          onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Failed to create quote');
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Quote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (INR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₹
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Estimated Days */}
          <div className="space-y-2">
            <Label htmlFor="estimatedDays">Estimated Days</Label>
            <Input
              id="estimatedDays"
              type="number"
              min="1"
              placeholder="e.g. 7"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
            />
          </div>

          {/* Validity Period */}
          <div className="space-y-2">
            <Label>Validity Period</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="validity"
                  checked={validityMode === 'default'}
                  onChange={() => setValidityMode('default')}
                />
                72 hours (default)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="validity"
                  checked={validityMode === 'custom'}
                  onChange={() => setValidityMode('custom')}
                />
                Custom
              </label>
            </div>
            {validityMode === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              placeholder="Additional details about this quote..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={createQuote.isPending}>
            {createQuote.isPending ? 'Creating...' : 'Create Quote'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { QuoteForm };
