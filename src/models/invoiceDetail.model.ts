import { z } from 'zod';

export const invoiceDetailSchema = z.object({
  invoice_detail_id: z.string().uuid(),
  transaction_note: z.string().min(1, { message: 'Item is required' }),
  delivery_count: z.number().min(0, { message: 'Price must be a positive number' }),
  price_per_delivery: z.number().min(0, { message: 'Price must be a positive number' }),
  amount: z.number().min(0, { message: 'Amount must be a positive number' }),
  invoice_id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const invoiceDetailCreateSchema = invoiceDetailSchema.pick({
  transaction_note: true,
  delivery_count: true,
  price_per_delivery: true,
});

export const invoiceDetailUpdateSchema = invoiceDetailCreateSchema.extend({
  invoice_detail_id: z.string().uuid().optional(),
});

export type InvoiceDetailCreate = z.infer<typeof invoiceDetailCreateSchema>;
export type InvoiceDetailUpdate = z.infer<typeof invoiceDetailUpdateSchema>;
