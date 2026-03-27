'use client';

/**
 * PayoutCycleSelector -- Date range picker with "Generate Payouts" button.
 * Used at the top of the admin payouts page to trigger payout cycle generation.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeneratePayout } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';
import { CalendarDays, Loader2 } from 'lucide-react';

export function PayoutCycleSelector() {
  const [cycleStart, setCycleStart] = useState('');
  const [cycleEnd, setCycleEnd] = useState('');

  const generatePayout = useGeneratePayout();

  function handleGenerate() {
    if (!cycleStart || !cycleEnd) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (cycleStart > cycleEnd) {
      toast.error('Start date must be before end date');
      return;
    }

    generatePayout.mutate(
      { cycleStart, cycleEnd },
      {
        onSuccess: () => {
          toast.success('Payout cycle generated successfully');
          setCycleStart('');
          setCycleEnd('');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Failed to generate payout cycle');
        },
      },
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4 bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        Generate Payout Cycle
      </div>

      <div className="space-y-1">
        <Label htmlFor="cycleStart" className="text-xs">Start Date</Label>
        <Input
          id="cycleStart"
          type="date"
          value={cycleStart}
          onChange={(e) => setCycleStart(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cycleEnd" className="text-xs">End Date</Label>
        <Input
          id="cycleEnd"
          type="date"
          value={cycleEnd}
          onChange={(e) => setCycleEnd(e.target.value)}
          className="w-40"
        />
      </div>

      <Button onClick={handleGenerate} disabled={generatePayout.isPending}>
        {generatePayout.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Payouts'
        )}
      </Button>
    </div>
  );
}
