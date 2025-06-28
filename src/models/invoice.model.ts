import { z } from 'zod';
import { invoiceDetailCreateSchema, invoiceDetailUpdateSchema } from './invoiceDetail.model';

export const invoiceSchema = z.object({
  invoice_id: z.string().uuid(),
  invoice_number: z.string().min(1, { message: 'Invoice number is required' }),
  issue_date: z.string().transform(val => new Date(val)),
  due_date: z.string().transform(val => new Date(val)),
  tax_rate: z.number().min(0, { message: 'Tax rate must be a positive number' }),
  tax_amount: z.number().min(0, { message: 'Tax amount must be a positive number' }),
  sub_total: z.number().min(0, { message: 'Sub total must be a positive number' }),
  total: z.number().min(0, { message: 'Total must be a positive number' }),
  tax_invoice_number: z.string().min(1, { message: 'Tax invoice number is required' }),
  amount_paid: z.number().min(0, { message: 'Amount paid must be a positive number' }),
  payment_status: z.enum(['paid', 'unpaid', 'partial'], {
    errorMap: () => ({ message: 'Payment status must be one of: paid, unpaid, partial' }),
  }),
  voided_at: z
    .string()
    .transform(val => new Date(val))
    .optional(),
  created_at: z.date(),
  updated_at: z.date(),
  client_id: z.string(),  
});

export const invoiceRequestSchema = invoiceSchema.pick({
  invoice_number: true,
  issue_date: true,
  due_date: true,
  tax_rate: true,
  tax_invoice_number: true,
  voided_at: true,
  client_id: true,
});

export const invoiceWithDetailsCreateSchema = invoiceRequestSchema.extend({
  invoice_details: z.array(invoiceDetailCreateSchema).min(1, {
    message: 'Invoice details are required',
  }),
});

export const invoiceWithDetailsUpdateSchema = invoiceRequestSchema.extend({
  invoice_details: z.array(invoiceDetailUpdateSchema).min(1, {
    message: 'Invoice details are required',
  }),
});

export const invoiceUpdateFromPaymentRequestSchema = invoiceSchema.pick({
  amount_paid: true,
  payment_status: true,
});

export type InvoiceRequest = z.infer<typeof invoiceRequestSchema>;
export type InvoiceWithDetailsRequest = z.infer<typeof invoiceWithDetailsCreateSchema>;
export type InvoiceUpdateFromPaymentRequest = z.infer<typeof invoiceUpdateFromPaymentRequestSchema>;

export type InvoiceWithDetailsUpdate = z.infer<typeof invoiceWithDetailsUpdateSchema>;
