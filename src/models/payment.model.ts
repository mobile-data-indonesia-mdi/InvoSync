import { z } from 'zod';

export const paymentSchema = z.object({
  payment_id: z.string().uuid(),
  payment_date: z.string().transform(val => new Date(val)),
  amount_paid: z.number().min(0, { message: 'Amount paid must be a positive number' }),
  proof_of_transfer: z.string().min(1, { message: 'Proof of transfer is required' }),
  voided_at: z
    .string()
    .transform(val => new Date(val))
    .nullable()
    .optional(),
  invoice_id: z.string().uuid(),
  invoice_number: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const paymentRequestSchema = paymentSchema.pick({
  payment_date: true,
  amount_paid: true,
  proof_of_transfer: true,
  voided_at: true,
  invoice_number: true,
});

export const paymentUpdateRequestSchema = paymentRequestSchema
  .extend({ invoice_id: paymentSchema.shape.invoice_id })
  .partial();

export type PaymentRequestSchema = z.infer<typeof paymentRequestSchema>;
export type PaymentUpdateRequestSchema = z.infer<typeof paymentUpdateRequestSchema>;
