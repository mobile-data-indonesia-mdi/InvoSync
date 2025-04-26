import { prisma } from '@config/db';
import type { PaymentRequestSchema, PaymentUpdateRequestSchema } from '@models/payment.model';
import {
  getInvoiceForPaymentService,
  updateInvoiceForPaymentService,
} from '@services/invoice.service';

export const createPaymentService = async (paymentData: PaymentRequestSchema) => {
  try {
    const invoiceData = getInvoiceForPaymentService(paymentData.invoice_id);
    if ((await invoiceData).payment_status == 'paid') {
      throw new Error(`Client sudah membayar semua tagihan pada invoice ${paymentData.invoice_id}`);
    }

    // Hitung uang yang sudah dibayar
    const newest_amount_paid = (await invoiceData).amount_paid + paymentData.amount_paid;
    const remaining_balance = (await invoiceData).total - newest_amount_paid;
    var updated_payment_status = '';
    if (remaining_balance > 0) {
      if (remaining_balance == (await invoiceData).total) {
        updated_payment_status = 'unpaid';
      }
      updated_payment_status = 'partial';
    } else if (remaining_balance == 0) {
      updated_payment_status = 'paid';
    } else {
      // lebih bayar
      throw new Error(
        `Pembayaran melebihi total tagihan (lebih bayar sebesar Rp${Math.abs(remaining_balance)})`,
      );
    }

    const createdPayment = await prisma.$transaction(async tx => {
      // Create payment from user inputs
      const payment = await tx.payment.create({
        data: {
          payment_date: paymentData.payment_date,
          amount_paid: paymentData.amount_paid,
          proof_of_transfer: paymentData.proof_of_transfer,
          voided_at: paymentData.voidedAt,
          invoice_id: paymentData.invoice_id,
        },
      });
      // Update table invoices
      const updateData = {
        amount_paid: newest_amount_paid,
        payment_status: updated_payment_status as 'paid' | 'unpaid' | 'partial',
      };
      await updateInvoiceForPaymentService(tx, paymentData.invoice_id, updateData);

      return payment;
    });

    return createdPayment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const getAllPaymentService = async () => {
  try {
    const payment = await prisma.payment.findMany({
      orderBy: {
        payment_date: 'asc',
      },
    });

    return payment;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const getPaymentByClientService = async (client_id: string) => {
  try {
    const payment = await prisma.payment.findMany({
      where: {
        invoice: {
          client_id,
        },
      },
    });

    if (!payment) {
      throw new Error(`Payment untuk client tidak ditemukan`);
    }

    return payment;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const getPaymentByIdService = async (payment_id: string) => {
  try {
    const payment = await prisma.payment.findMany({
      where: {
        payment_id,
      },
    });

    if (!payment) {
      throw new Error(`Payment tidak ditemukan`);
    }

    return payment;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const updatePaymentService = async (
  payment_id: string,
  paymentData: PaymentUpdateRequestSchema,
) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: {
        payment_id,
      },
    });

    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    const updatedPayment = await prisma.$transaction(async tx => {
      const payment = await prisma.payment.update({
        where: {
          payment_id,
        },
        data: paymentData,
      });
      return payment;
    });

    return updatedPayment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const deletePaymentByIdService = async (payment_id: string) => {
  try {
    const invoice = await prisma.payment.findUnique({
      where: {
        payment_id,
      },
    });

    if (!invoice) {
      throw new Error('Payment tidak ditemukan');
    }

    const deletedPayment = await prisma.payment.delete({
      where: {
        payment_id,
      },
    });

    return deletedPayment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const restorePaymentService = async (payment_id: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: {
        payment_id,
      },
    });

    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    const voidPayment = await prisma.payment.update({
      where: { payment_id },
      data: {
        voided_at: null,
      },
    });

    return voidPayment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};
