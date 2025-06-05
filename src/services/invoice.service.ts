import { prisma } from '@config/db';

import {
  type InvoiceWithDetailsRequest,
  type InvoiceWithDetailsUpdate,
} from '@models/invoice.model';
import type { Prisma } from '@prisma/client';
import HttpError from '@utils/httpError';
import { updatePaymentColInvoiceNumberService } from './payment.service';

export const createInvoiceService = async (invoiceData: InvoiceWithDetailsRequest) => {
  try {
    const isInvoiceNumberExists = await prisma.invoice.findUnique({
      where: {
        invoice_number: invoiceData.invoice_number,
      },
    });

    if (isInvoiceNumberExists) {
      throw new HttpError('Duplicate invoice', 409);
    }

    const isClientExists = await prisma.client.findUnique({
      where: {
        client_id: invoiceData.client_id,
      },
    });

    if (!isClientExists) {
      throw new HttpError('Client not found', 404);
    }

    const invoiceDetailsWithAmount = invoiceData.invoice_details.map(detail => ({
      ...detail,
      amount: detail.delivery_count * detail.price_per_delivery,
    }));

    const taxRate = invoiceData.tax_rate / 100;
    const subTotal = invoiceDetailsWithAmount.reduce((acc, detail) => acc + detail.amount, 0);
    const taxAmount = subTotal * taxRate;
    const total = subTotal + taxAmount;

    const amountPaid = 0;
    const paymentStatus = 'unpaid';

    const createdInvoice = await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.create({
        data: {
          invoice_number: invoiceData.invoice_number,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          sub_total: subTotal,
          tax_rate: taxRate,
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
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

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
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
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
      throw new HttpError('Invoice not found', 404);
    }

    return invoice;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const updateInvoiceByIdService = async (
  invoice_id: string,
  invoiceData: InvoiceWithDetailsUpdate,
) => {
  try {
    const isInvoiceExist = await prisma.invoice.findUnique({
      where: {
        invoice_id,
      },
    });

    if (!isInvoiceExist) {
      throw new HttpError('Invoice not found', 404);
    }

    const isClientExists = await prisma.client.findUnique({
      where: {
        client_id: invoiceData.client_id,
      },
    });

    if (!isClientExists) {
      throw new HttpError('Client not found', 404);
    }

    const updatedInvoice = await prisma.$transaction(async tx => {
      const existingDetails = await tx.invoiceDetail.findMany({
        where: { invoice_id },
      });

      const incomingDetails = invoiceData.invoice_details;

      // Update or create details
      for (const detail of incomingDetails) {
        if (detail.invoice_detail_id) {
          await tx.invoiceDetail.update({
            where: { invoice_detail_id: detail.invoice_detail_id },
            data: {
              transaction_note: detail.transaction_note,
              delivery_count: detail.delivery_count,
              price_per_delivery: detail.price_per_delivery,
              amount: detail.delivery_count * detail.price_per_delivery,
            },
          });
        } else {
          await tx.invoiceDetail.create({
            data: {
              ...detail,
              amount: detail.delivery_count * detail.price_per_delivery,
              invoice_id,
            },
          });
        }
      }

      // Delete removed details
      const incomingIds = incomingDetails
        .filter(d => d.invoice_detail_id)
        .map(d => d.invoice_detail_id);
      const toDelete = existingDetails.filter(d => !incomingIds.includes(d.invoice_detail_id));

      for (const detail of toDelete) {
        await tx.invoiceDetail.delete({ where: { invoice_detail_id: detail.invoice_detail_id } });
      }

      // Recalculate totals
      const updatedDetails = await tx.invoiceDetail.findMany({
        where: { invoice_id },
      });
      const taxRate = invoiceData.tax_rate / 100;
      const subTotal = updatedDetails.reduce((acc, detail) => acc + detail.amount, 0);
      const taxAmount = subTotal * taxRate;
      const totalAmount = subTotal + taxAmount;

      // Update main invoice
      const updatedInvoice = await tx.invoice.update({
        where: { invoice_id },
        data: {
          invoice_number: invoiceData.invoice_number,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          sub_total: subTotal,
          total: totalAmount,
          tax_invoice_number: invoiceData.tax_invoice_number,
          voided_at: invoiceData.voided_at,
          client_id: invoiceData.client_id,
        },
      });

      await _updateInvoiceColPaymentStatusService(tx, invoice_id);

      // Update payment table if invoice number is changed
      if (isInvoiceExist.invoice_number !== invoiceData.invoice_number) {
        await updatePaymentColInvoiceNumberService(tx, invoice_id, invoiceData.invoice_number);
      }

      return updatedInvoice;
    });

    return updatedInvoice;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.log(error);
    throw new HttpError('Internal Server Error', 500);
  }
};

// export const deleteInvoiceByIdService = async (invoice_id: string) => {
//   try {
//     const invoice = await prisma.invoice.findUnique({
//       where: { invoice_id },
//     });

//     if (!invoice) {
//       throw new Error('Invoice tidak ditemukan');
//     }

//     await prisma.invoice.delete({
//       where: { invoice_id },
//     });

//     return;
//   } catch (error) {
//     if (error instanceof HttpError) {
//       throw error;
//     }

//     throw new HttpError('Internal Server Error', 500);
//   }
// };

export const toggleInvoiceVoidStatusService = async (invoice_id: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoice_id },
    });

    if (!invoice) {
      throw new HttpError('Invoice not found', 404);
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { invoice_id },
      data: {
        voided_at: invoice.voided_at ? null : new Date(),
      },
    });

    return updatedInvoice;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

// Payments Services -> Invoice Services
export const getInvoiceByInvoiceNumberService = async (invoiceNumber: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        invoice_number: invoiceNumber,
      },
      select: {
        invoice_id: true,
        payment_status: true,
      },
    });

    if (!invoice) {
      throw new HttpError(`Invoice with number ${invoiceNumber} not found`, 404);
    }

    return invoice;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

// Helper to update amount paid in invoice
export const updateInvoiceColAmountPaidService = async (
  tx: Prisma.TransactionClient,
  invoiceId: string,
) => {
  try {
    const invoice = await tx.invoice.findUnique({
      where: { invoice_id: invoiceId },
      select: { amount_paid: true },
    });

    if (!invoice) {
      throw new HttpError('Invoice not found', 404);
    }

    const payments = await tx.payment.findMany({
      where: { invoice_id: invoiceId, voided_at: null },
      select: { amount_paid: true },
    });

    const totalAmountPaid = payments.reduce((acc, payment) => acc + payment.amount_paid, 0);

    await tx.invoice.update({
      where: { invoice_id: invoiceId },
      data: { amount_paid: totalAmountPaid },
    });
    await _updateInvoiceColPaymentStatusService(tx, invoiceId);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

// Helper to update payment status in invoice
const _updateInvoiceColPaymentStatusService = async (
  tx: Prisma.TransactionClient,
  invoiceId: string,
) => {
  try {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { invoice_id: invoiceId },
      select: { total: true, amount_paid: true },
    });

    if (invoice.amount_paid > invoice.total) {
      throw new HttpError('Overpayment detected', 409);
    }

    if (invoice.amount_paid < 0) {
      throw new HttpError('Negative payment amount detected', 409);
    }

    const paymentStatus =
      invoice.amount_paid === invoice.total
        ? 'paid'
        : invoice.amount_paid > 0
          ? 'partial'
          : 'unpaid';

    await tx.invoice.update({
      where: { invoice_id: invoiceId },
      data: { payment_status: paymentStatus },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getAllReceivableService = async () => {
  try {
    const receivables = await prisma.invoice.findMany({
      where: {
        payment_status: {
          in: ['unpaid', 'partial'],
        },
      },
      include: {
        client: true,
        invoice_details: true,
      },
    });

    return receivables;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};
