import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
  productType: z.enum(['READY_STOCK', 'MADE_TO_ORDER', 'ON_DEMAND']),
  priceInCents: z.number().int().positive().optional(),
  compareAtPriceInCents: z.number().int().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  leadTimeDays: z.number().int().positive().optional(),
  returnPolicy: z.enum(['DEFECT_ONLY', 'NO_RETURN', 'STANDARD']),
  meta: z
    .object({
      materials: z.array(z.string()).optional(),
      dimensions: z.string().optional(),
      weight: z.string().optional(),
      careInstructions: z.string().optional(),
      colors: z.array(z.string()).optional(),
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
