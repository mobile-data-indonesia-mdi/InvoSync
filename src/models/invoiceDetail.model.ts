import { z } from 'zod';

export const invoiceDetailSchema = z.object({
  invoice_detail_id: z.string().uuid(),
  transaction_note: z.string().min(1, { message: 'Item is required' }),
  delivery_count: z.string().min(1, { message: 'Usage is required' }),
  price_per_delivery: z.number().min(0, { message: 'Price must be a positive number' }),
  amount: z.number().min(0, { message: 'Ammount must be a positive number' }),
  invoice_id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const invoiceDetailRequestSchema = invoiceDetailSchema.pick({
  transaction_note: true,
  delivery_count: true,
  price_per_delivery: true,
  amount: true,
  invoice_id: true,
});
