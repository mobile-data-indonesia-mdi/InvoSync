import { z } from 'zod';

export const invoiceSchema = z.object({
  invoice_id: z.string().uuid(),
  invoice_number: z.string().min(1, { message: 'Invoice number is required' }),
  issue_date: z.date(),
  due_date: z.date(),
  tax_rate: z.number().min(0, { message: 'Tax rate must be a positive number' }),
  tax_amount: z.number().min(0, { message: 'Tax amount must be a positive number' }),
  sub_total: z.number().min(0, { message: 'Sub total must be a positive number' }),
  total: z.number().min(0, { message: 'Total must be a positive number' }),
  tax_invoice_number: z.string().min(1, { message: 'Tax invoice number is required' }),
  amount_paid: z.number().min(0, { message: 'Amount paid must be a positive number' }),
  payment_status: z.enum(['paid', 'unpaid', 'partial'], {
    errorMap: () => ({ message: 'Payment status must be one of: paid, unpaid, partial' }),
  }),
  voidedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const invoiceRequestSchema = invoiceSchema.pick({
  invoice_number: true,
  issue_date: true,
  due_date: true,
  tax_rate: true,
  tax_invoice_number: true,
  voidedAt: true,
});
