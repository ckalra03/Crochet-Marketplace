'use client';

/**
 * ResolutionForm -- Dispute resolution form for admin use.
 * Submits a resolution summary via useResolveDispute().
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useResolveDispute } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';

interface ResolutionFormProps {
  disputeId: string;
  onSuccess?: () => void;
}

function ResolutionForm({ disputeId, onSuccess }: ResolutionFormProps) {
  const [summary, setSummary] = useState('');
  const resolveDispute = useResolveDispute();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!summary.trim()) {
      toast.error('Resolution summary is required.');
      return;
    }

    resolveDispute.mutate(
      { id: disputeId, resolutionSummary: summary.trim() },
      {
        onSuccess: () => {
          toast.success('Dispute resolved successfully.');
          setSummary('');
          onSuccess?.();
        },
        onError: () => {
          toast.error('Failed to resolve dispute. Please try again.');
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resolution-summary">Resolution Summary *</Label>
        <Textarea
          id="resolution-summary"
          placeholder="Describe the resolution decision and any actions taken..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          required
        />
      </div>

      <Button type="submit" disabled={resolveDispute.isPending || !summary.trim()}>
        {resolveDispute.isPending ? 'Resolving...' : 'Resolve Dispute'}
      </Button>
    </form>
  );
}

export { ResolutionForm };
