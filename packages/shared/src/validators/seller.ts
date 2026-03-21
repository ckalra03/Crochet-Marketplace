import { z } from 'zod';

export const sellerRegisterSchema = z.object({
  businessName: z.string().min(3).max(255),
  description: z.string().min(20).max(2000).optional(),
  address: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().length(2).default('IN'),
    })
    .optional(),
});

export const updateSellerProfileSchema = sellerRegisterSchema.partial();

export const rejectSellerSchema = z.object({
  reason: z.string().min(5).max(500),
});

export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>;
export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>;
