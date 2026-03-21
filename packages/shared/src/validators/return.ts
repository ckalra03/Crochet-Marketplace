import { z } from 'zod';

export const createReturnSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid().optional(),
  reason: z.enum(['DEFECTIVE', 'WRONG_ITEM', 'TRANSIT_DAMAGE', 'PREFERENCE_CHANGE', 'OTHER']),
  description: z.string().min(10).max(1000).optional(),
});

export const reviewReturnSchema = z.object({
  resolution: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'REPLACEMENT', 'REJECTED']),
  refundAmountInCents: z.number().int().min(0).optional(),
  adminNotes: z.string().max(1000).optional(),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type ReviewReturnInput = z.infer<typeof reviewReturnSchema>;
