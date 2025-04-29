import { prisma } from '@config/db';
import { type PaymentRequestSchema, type PaymentUpdateRequestSchema } from '@models/payment.model';
import type { Prisma } from '@prisma/client';
import { getPaymentStatusService, updateInvoiceAmountPaidService } from '@services/invoice.service';
import fs from 'fs';
import path from 'path';

export const createPaymentService = async (
  paymentData: PaymentRequestSchema,
  file: Express.Multer.File | undefined,
) => {
  try {
    const invoiceData = await getPaymentStatusService(paymentData.invoice_id);
    if (invoiceData.payment_status === 'paid') {
      throw new Error(`Client sudah membayar semua tagihan pada invoice ${paymentData.invoice_id}`);
    }

    const createdPayment = await prisma.$transaction(async tx => {
      // Create payment from user inputs
      const payment = await tx.payment.create({
        data: {
          payment_date: paymentData.payment_date,
          amount_paid: paymentData.amount_paid,
          proof_of_transfer: paymentData.proof_of_transfer,
          voided_at: paymentData.voided_at,
          invoice_id: paymentData.invoice_id,
        },
      });

      // Update invoice amount paid and payment status
      await updateInvoiceAmountPaidService(tx, paymentData.invoice_id);

      return payment;
    });

    // Ganti nama file dengan payment_id
    if (file && createdPayment.payment_id) {
      const oldPath = file.path;
      const extension = file.mimetype.split('/')[1]; // Ambil ekstensi file
      const newPath = path.join(path.dirname(oldPath), `${createdPayment.payment_id}.${extension}`);

      // Rename file untuk menggunakan payment_id
      fs.rename(oldPath, newPath, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error('Error renaming file:', err);
        }
      });

      await updatePaymentProofOfTransferService(createdPayment.payment_id, newPath);
    }

    return await getPaymentByIdService(createdPayment.payment_id);
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
    const payment = await prisma.payment.findUnique({
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

export const editPaymentService = async (
  payment_id: string,
  paymentData: PaymentUpdateRequestSchema,
  file: Express.Multer.File | undefined,
) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { payment_id },
    });

    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    const {
      amount_paid: oldAmountPaid,
      invoice_id: oldInvoiceId,
      voided_at: oldVoidedAt,
      proof_of_transfer: oldProofOfTransfer,
    } = payment;
    const newAmountPaid = paymentData.amount_paid ?? oldAmountPaid;
    const newInvoiceId = paymentData.invoice_id ?? oldInvoiceId;
    const newVoidedAt = paymentData.hasOwnProperty('voided_at')
      ? paymentData.voided_at
      : oldVoidedAt;

    const voidStatusChanged = oldVoidedAt !== newVoidedAt;
    const invoiceIdChanged = oldInvoiceId !== newInvoiceId;
    const amountPaidChanged = oldAmountPaid !== newAmountPaid;

    let newFilePath: string | undefined = oldProofOfTransfer;

    if (file) {
      // Jika ada file baru yang diunggah, ganti nama file menjadi payment_id
      const oldPath = file.path;
      const extension = file.mimetype.split('/')[1]; // Ambil ekstensi file
      const newPath = path.join(path.dirname(oldPath), `${payment_id}.${extension}`);
      fs.renameSync(oldPath, newPath); // Rename file secara langsung

      newFilePath = newPath; // Update path file
      paymentData.proof_of_transfer = newFilePath; // Update path file di data payment
    }

    const updatedPayment = await prisma.$transaction(async tx => {
      const updateData: Prisma.PaymentUpdateInput = { ...paymentData };

      if (amountPaidChanged || invoiceIdChanged || voidStatusChanged) {
        await tx.payment.update({ where: { payment_id }, data: updateData });

        if (invoiceIdChanged) {
          await updateInvoiceAmountPaidService(tx, oldInvoiceId);
          await updateInvoiceAmountPaidService(tx, newInvoiceId);
        } else {
          await updateInvoiceAmountPaidService(tx, oldInvoiceId);
        }
      } else {
        await tx.payment.update({ where: { payment_id }, data: updateData });
      }

      return tx.payment.findUnique({ where: { payment_id } });
    });

    // Jika ada file lama yang harus dihapus
    if (newFilePath && oldProofOfTransfer !== newFilePath) {
      const oldFilePath = path.resolve(oldProofOfTransfer);
      fs.unlinkSync(oldFilePath); // Hapus file lama secara sinkron
    }

    return updatedPayment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const deletePaymentByIdService = async (payment_id: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: {
        payment_id,
      },
    });

    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    const invoiceID = payment.invoice_id;
    const proofOfTransferPath = payment.proof_of_transfer;

    // Hapus payment dari database
    const deletedPayment = await prisma.$transaction(async tx => {
      const deleted = await tx.payment.delete({
        where: { payment_id },
      });
      await updateInvoiceAmountPaidService(tx, invoiceID);

      return deleted;
    });

    // Menghapus file proof_of_transfer
    if (proofOfTransferPath) {
      const filePath = path.resolve(proofOfTransferPath);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
          if (err) {
            console.error('Error deleting file:', err);
          } else {
            console.log(`File deleted: ${filePath}`);
          }
        });
      } else {
        console.warn(`File not found at: ${filePath}`);
      }
    }

    return deletedPayment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const getProofPaymentService = async (payment_filename: string) => {
  try {
    const proofOfTransferPath = path.resolve('uploads/payments', payment_filename);
    
    return proofOfTransferPath;
  }
 catch (error) {
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

    const invoiceID = payment.invoice_id;

    const restorePayment = await prisma.$transaction(async tx => {
      const restore = await prisma.payment.update({
        where: { payment_id },
        data: {
          voided_at: null,
        },
      });
      updateInvoiceAmountPaidService(tx, invoiceID);
      return restore;
    });

    return restorePayment;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

// Update proof_of_transfer di database
export const updatePaymentProofOfTransferService = async (
  payment_id: string,
  newPath: string,
): Promise<void> => {
  await prisma.payment.update({
    where: { payment_id },
    data: { proof_of_transfer: newPath },
  });
};
