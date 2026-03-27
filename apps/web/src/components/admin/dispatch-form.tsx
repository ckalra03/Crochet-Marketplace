'use client';

/**
 * DispatchForm -- Form for entering tracking number and shipping carrier
 * to dispatch a warehouse item. Submits via useDispatchItem().
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDispatchItem } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';

/** Supported Indian shipping carriers. */
const CARRIERS = [
  'India Post',
  'DTDC',
  'Blue Dart',
  'Delhivery',
  'Other',
] as const;

interface DispatchFormProps {
  /** Warehouse item ID to dispatch. */
  warehouseItemId: string;
  /** Optional callback after successful dispatch. */
  onSuccess?: () => void;
}

function DispatchForm({ warehouseItemId, onSuccess }: DispatchFormProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');

  const dispatchItem = useDispatchItem();

  /** Validate and submit the dispatch form. */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      toast.error('Tracking number is required');
      return;
    }
    if (!shippingCarrier) {
      toast.error('Please select a shipping carrier');
      return;
    }

    dispatchItem.mutate(
      {
        id: warehouseItemId,
        data: { trackingNumber: trackingNumber.trim(), shippingCarrier },
      },
      {
        onSuccess: () => {
          toast.success('Item dispatched successfully');
          onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'Dispatch failed');
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tracking number */}
      <div className="space-y-2">
        <Label htmlFor="tracking-number" className="text-sm font-semibold">
          Tracking Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="tracking-number"
          placeholder="e.g. RM123456789IN"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />
      </div>

      {/* Shipping carrier */}
      <div className="space-y-2">
        <Label htmlFor="shipping-carrier" className="text-sm font-semibold">
          Shipping Carrier <span className="text-red-500">*</span>
        </Label>
        <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
          <SelectTrigger id="shipping-carrier">
            <SelectValue placeholder="Select carrier" />
          </SelectTrigger>
          <SelectContent>
            {CARRIERS.map((carrier) => (
              <SelectItem key={carrier} value={carrier}>
                {carrier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={dispatchItem.isPending}>
        {dispatchItem.isPending ? 'Dispatching...' : 'Dispatch Item'}
      </Button>
    </form>
  );
}

export { DispatchForm };
export type { DispatchFormProps };
