'use client';

/**
 * ReturnForm -- Form for submitting a return request.
 *
 * Features:
 * - Order item selector (populated from order if provided)
 * - Reason dropdown (DEFECTIVE, WRONG_ITEM, TRANSIT_DAMAGE, PREFERENCE_CHANGE, OTHER)
 * - Description textarea
 * - Evidence file input (names stored, actual upload is a placeholder)
 * - Policy callout showing eligibility based on product type + reason
 * - Zod validation
 * - Submit via useSubmitReturn()
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useSubmitReturn } from '@/lib/hooks/use-returns';
import { useOrder } from '@/lib/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Upload, X } from 'lucide-react';

/* ───────────── Return reason options ───────────── */

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Defective / Damaged Product' },
  { value: 'WRONG_ITEM', label: 'Wrong Item Received' },
  { value: 'TRANSIT_DAMAGE', label: 'Damaged During Transit' },
  { value: 'PREFERENCE_CHANGE', label: 'Changed My Mind' },
  { value: 'OTHER', label: 'Other' },
] as const;

/* ───────────── Zod schema ───────────── */

const returnFormSchema = z.object({
  orderItemId: z.string().min(1, 'Please select an order item'),
  reason: z.enum(['DEFECTIVE', 'WRONG_ITEM', 'TRANSIT_DAMAGE', 'PREFERENCE_CHANGE', 'OTHER'], {
    required_error: 'Please select a reason',
  }),
  description: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

/* ───────────── Policy eligibility helper ───────────── */

/**
 * Returns a policy message based on product type and reason.
 * Ready-stock items are generally eligible for returns; made-to-order
 * and on-demand items are only returnable for defects/wrong items/transit damage.
 */
function getPolicyMessage(productType?: string, reason?: string): { eligible: boolean; message: string } {
  if (!reason) {
    return { eligible: true, message: 'Select a reason to see return eligibility.' };
  }

  const isDefectBased = ['DEFECTIVE', 'WRONG_ITEM', 'TRANSIT_DAMAGE'].includes(reason);

  if (productType === 'MADE_TO_ORDER' || productType === 'ON_DEMAND') {
    if (isDefectBased) {
      return {
        eligible: true,
        message: 'Custom/made-to-order items are eligible for return when defective, wrong, or damaged in transit.',
      };
    }
    return {
      eligible: false,
      message: 'Custom/made-to-order items cannot be returned for preference changes. Only defect-based returns are accepted.',
    };
  }

  // Ready-stock items are always returnable within the return window
  return {
    eligible: true,
    message: isDefectBased
      ? 'This item is eligible for a full refund for defect-based returns.'
      : 'Ready-stock items can be returned within 7 days. A restocking fee may apply for preference changes.',
  };
}

/* ───────────── Component ───────────── */

interface ReturnFormProps {
  /** Pre-selected order number (from URL params) */
  orderNumber?: string;
  /** Pre-selected order item ID (from URL params) */
  orderItemId?: string;
}

function ReturnForm({ orderNumber, orderItemId }: ReturnFormProps) {
  const router = useRouter();
  const submitReturn = useSubmitReturn();

  // Fetch order details if an order number is provided
  const { data: order } = useOrder(orderNumber ?? '');

  // Form state
  const [selectedItemId, setSelectedItemId] = useState(orderItemId ?? '');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine the selected item's product type for policy callout
  const selectedItem = order?.items?.find((item: any) => item.id === selectedItemId);
  const policy = getPolicyMessage(selectedItem?.productType, reason);

  /** Handle file input change — store file names as placeholders */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setEvidenceFiles((prev) => [...prev, ...names]);
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  }, []);

  /** Remove an evidence file by index */
  const removeFile = useCallback((index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** Validate and submit */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = returnFormSchema.safeParse({
      orderItemId: selectedItemId,
      reason,
      description: description || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    // Check policy eligibility before submitting
    if (!policy.eligible) {
      setErrors({ reason: 'This item is not eligible for return with the selected reason.' });
      return;
    }

    submitReturn.mutate(parsed.data, {
      onSuccess: () => {
        router.push('/returns');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order item selector */}
      <div className="space-y-2">
        <Label htmlFor="orderItem">Order Item</Label>
        {order?.items ? (
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger id="orderItem">
              <SelectValue placeholder="Select an item to return" />
            </SelectTrigger>
            <SelectContent>
              {order.items.map((item: any) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.productName} (Qty: {item.quantity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <input
            id="orderItem"
            type="text"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            placeholder="Enter order item ID"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        )}
        {errors.orderItemId && (
          <p className="text-sm text-red-600">{errors.orderItemId}</p>
        )}
      </div>

      {/* Reason dropdown */}
      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Return</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger id="reason">
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            {RETURN_REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.reason && (
          <p className="text-sm text-red-600">{errors.reason}</p>
        )}
      </div>

      {/* Policy callout */}
      {reason && (
        <Card className={policy.eligible ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${policy.eligible ? 'text-blue-600' : 'text-red-600'}`} />
            <p className={`text-sm ${policy.eligible ? 'text-blue-800' : 'text-red-800'}`}>
              {policy.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Description textarea */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide additional details about the issue..."
          rows={4}
        />
      </div>

      {/* Evidence file input */}
      <div className="space-y-2">
        <Label>Evidence Images (optional)</Label>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">
            <Upload className="h-4 w-4" />
            Choose files
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
        {/* List selected file names */}
        {evidenceFiles.length > 0 && (
          <ul className="mt-2 space-y-1">
            {evidenceFiles.map((name, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="shrink-0 rounded p-0.5 hover:bg-muted"
                  aria-label={`Remove ${name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitReturn.isPending || !policy.eligible}
        >
          {submitReturn.isPending ? 'Submitting...' : 'Submit Return Request'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Server error */}
      {submitReturn.isError && (
        <p className="text-sm text-red-600">
          {(submitReturn.error as any)?.response?.data?.message ?? 'Failed to submit return request. Please try again.'}
        </p>
      )}
    </form>
  );
}

export { ReturnForm };
export type { ReturnFormProps };
