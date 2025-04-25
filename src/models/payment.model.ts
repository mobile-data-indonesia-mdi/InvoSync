import { z } from 'zod';

export const paymentSchema = z.object({
  payment_id: z.string().uuid(),
  payment_date: z.date(),
  amount_paid: z.number().min(0, { message: 'Amount paid must be a positive number' }),
  proof_of_transfer: z.string().min(1, { message: 'Proof of transfer is required' }),
  voidedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const paymentRequestSchema = paymentSchema.pick({
  payment_date: true,
  amount_paid: true,
  proof_of_transfer: true,
  voidedAt: true,
});
