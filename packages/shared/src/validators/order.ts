import { z } from 'zod';

export const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid(),
  notes: z.string().max(500).optional(),
  policyAcknowledged: z.boolean().refine((v) => v === true, {
    message: 'You must acknowledge the return policy',
  }),
  // Payment method: COD is the only option for now
  paymentMethod: z.enum(['COD']).optional().default('COD'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'CONFIRMED',
    'PROCESSING',
    'IN_PRODUCTION',
    'WAREHOUSE_RECEIVED',
    'QC_IN_PROGRESS',
    'PACKING',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
