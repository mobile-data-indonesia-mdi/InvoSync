import { prisma } from '@config/db';

import {
  invoiceWithDetailsRequestSchema,
  type InvoiceUpdateFromPaymentRequestSchema,
  type InvoiceWithDetailsUpdate,
} from '@models/invoice.model';
import type { PrismaClient } from '@prisma/client/extension';

export const getAllInvoiceService = async () => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        invoice_details: true,
      },
    });

    return invoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const getInvoiceByIdService = async (invoice_id: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        invoice_id,
      },
      include: {
        client: true,
        invoice_details: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan');
    }

    return invoice;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const createInvoiceService = async (invoiceData: invoiceWithDetailsRequestSchema) => {
  try {
    // Calculate amounts for each invoice detail
    const invoiceDetailsWithAmount = invoiceData.invoice_details.map(detail => ({
      ...detail,
      amount: detail.delivery_count * detail.price_per_delivery,
    }));

    // Calculate subtotal, tax amount, and total
    const subTotal = invoiceDetailsWithAmount.reduce((acc, detail) => acc + detail.amount, 0);
    const taxAmount = subTotal * invoiceData.tax_rate;
    const total = subTotal + taxAmount;

    // Default values for payment
    const amountPaid = 0;
    const paymentStatus = 'unpaid';

    // Create invoice and associated details in a transaction
    const createdInvoice = await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.create({
        data: {
          invoice_number: invoiceData.invoice_number,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          sub_total: subTotal,
          tax_rate: invoiceData.tax_rate,
          tax_amount: taxAmount,
          total,
          tax_invoice_number: invoiceData.tax_invoice_number,
          amount_paid: amountPaid,
          voided_at: invoiceData.voided_at,
          payment_status: paymentStatus,
          client_id: invoiceData.client_id,
        },
      });

      await tx.invoiceDetail.createMany({
        data: invoiceDetailsWithAmount.map(detail => ({
          ...detail,
          invoice_id: invoice.invoice_id,
        })),
      });

      return invoice;
    });

    return createdInvoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred while creating the invoice';
    throw new Error(errorMessage);
  }
};

export const updateInvoiceByIdService = async (
  invoice_id: string,
  invoiceData: InvoiceWithDetailsUpdate,
) => {
  try {
    const updatedInvoice = await prisma.$transaction(async tx => {
      // Fetch existing details
      const existingDetails = await tx.invoiceDetail.findMany({
        where: { invoice_id },
      });

      const incomingDetails = invoiceData.invoice_details;

      // Update or create incoming details
      for (const detail of incomingDetails) {
        if (detail.invoice_detail_id) {
          await tx.invoiceDetail.update({
            where: { invoice_detail_id: detail.invoice_detail_id },
            data: {
              transaction_note: detail.transaction_note,
              delivery_count: detail.delivery_count,
              price_per_delivery: detail.price_per_delivery,
            },
          });
        } else {
          const amount = detail.delivery_count * detail.price_per_delivery;
          await tx.invoiceDetail.create({
            data: {
              ...detail,
              amount,
              invoice_id,
            },
          });
        }
      }

      // Identify and delete removed details
      const incomingIds = incomingDetails
        .filter(d => d.invoice_detail_id)
        .map(d => d.invoice_detail_id);
      const toDelete = existingDetails.filter(d => !incomingIds.includes(d.invoice_detail_id));

      for (const detail of toDelete) {
        await tx.invoiceDetail.delete({ where: { invoice_detail_id: detail.invoice_detail_id } });
      }

      // Update the invoice itself
      const updatedInvoice = await tx.invoice.update({
        where: { invoice_id },
        data: {
          invoice_number: invoiceData.invoice_number,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          tax_rate: invoiceData.tax_rate,
          tax_invoice_number: invoiceData.tax_invoice_number,
          voided_at: invoiceData.voided_at,
          client_id: invoiceData.client_id,
        },
      });

      return updatedInvoice;
    });

    return updatedInvoice;
  } catch (error) {
    console.error('Error updating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const deleteInvoiceByIdService = async (invoice_id: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        invoice_id,
      },
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan');
    }

    const deletedInvoice = await prisma.invoice.delete({
      where: {
        invoice_id,
      },
    });

    return deletedInvoice;
    // return deletedInvoice;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

// Update from Payment
export const getInvoiceForPaymentService = async (invoice_id: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        invoice_id,
      },
      select: {
        total: true,
        amount_paid: true,
        payment_status: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan');
    }

    return invoice;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const updateInvoiceForPaymentService = async (
  tx: PrismaClient,
  invoice_id: string,
  invoiceData: InvoiceUpdateFromPaymentRequestSchema,
) => {
  try {
    const invoice = await tx.invoice.findUnique({
      where: {
        invoice_id,
      },
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan');
    }

    const updatedInvoice = await tx.invoice.update({
      where: {
        invoice_id,
      },
      data: invoiceData,
    });

    return updatedInvoice;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};
