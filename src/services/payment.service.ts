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
      const newFilename = `${createdPayment.payment_id}.${extension}`;
      const newPath = path.join(path.dirname(oldPath), newFilename);
      
      // Rename file untuk menggunakan payment_id
      fs.rename(oldPath, newPath, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error('Error renaming file:', err);
        }
      });

      const urlPath = path.join('payment/upload', newFilename); // Path untuk disimpan di database
      await updatePaymentProofOfTransferService(createdPayment.payment_id, urlPath); // Update path file di database
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
  paymentId: string,
  updatedPaymentData: PaymentUpdateRequestSchema,
  uploadedFile: Express.Multer.File | undefined,
) => {
  try {
    const existingPayment = await prisma.payment.findUnique({
      where: { payment_id: paymentId },
    });

    if (!existingPayment) {
      throw new Error('Payment tidak ditemukan');
    }

    const {
      amount_paid: currentAmountPaid,
      invoice_id: currentInvoiceId,
      voided_at: currentVoidedAt,
      proof_of_transfer: currentProofOfTransfer,
    } = existingPayment;

    const newAmountPaid = updatedPaymentData.amount_paid ?? currentAmountPaid;
    const newInvoiceId = updatedPaymentData.invoice_id ?? currentInvoiceId;
    const newVoidedAt = updatedPaymentData.hasOwnProperty('voided_at')
      ? updatedPaymentData.voided_at
      : currentVoidedAt;

    const hasVoidStatusChanged = currentVoidedAt !== newVoidedAt;
    const hasInvoiceIdChanged = currentInvoiceId !== newInvoiceId;
    const hasAmountPaidChanged = currentAmountPaid !== newAmountPaid;

    let newProofOfTransferPath: string | undefined = currentProofOfTransfer;

    if (uploadedFile) {
      const tempFilePath = uploadedFile.path;
      const fileExtension = uploadedFile.mimetype.split('/')[1];
      const renamedFileName = `${paymentId}.${fileExtension}`;
      const renamedFilePath = path.join(path.dirname(tempFilePath), renamedFileName);
      fs.renameSync(tempFilePath, renamedFilePath);

      newProofOfTransferPath = path.join('payment/upload', renamedFileName);
      updatedPaymentData.proof_of_transfer = newProofOfTransferPath;
    }

    const updatedPayment = await prisma.$transaction(async transaction => {
      const updatePayload: Prisma.PaymentUpdateInput = { ...updatedPaymentData };

      if (hasAmountPaidChanged || hasInvoiceIdChanged || hasVoidStatusChanged) {
        await transaction.payment.update({ where: { payment_id: paymentId }, data: updatePayload });

        if (hasInvoiceIdChanged) {
          await updateInvoiceAmountPaidService(transaction, currentInvoiceId);
          await updateInvoiceAmountPaidService(transaction, newInvoiceId);
        } else {
          await updateInvoiceAmountPaidService(transaction, currentInvoiceId);
        }
      } else {
        await transaction.payment.update({ where: { payment_id: paymentId }, data: updatePayload });
      }

      return transaction.payment.findUnique({ where: { payment_id: paymentId } });
    });

    if (currentProofOfTransfer && newProofOfTransferPath !== currentProofOfTransfer) {
      const currentFileName = currentProofOfTransfer.split('\\').pop();
      const currentFilePath = currentFileName ? await getProofPaymentService(currentFileName) : '';
      const newFileName = newProofOfTransferPath.split('\\').pop();
      const newFilePath = newFileName ? await getProofPaymentService(newFileName) : '';

      if (newFilePath && currentFilePath !== newFilePath) {
        console.log('Menghapus file lama:', currentFilePath);
        const resolvedCurrentFilePath = path.resolve(currentFilePath);
        fs.unlinkSync(resolvedCurrentFilePath);
      }
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
    const proofOfTransferPath = path.resolve('uploads/payments', payment_filename); // example path: 'uploads/payments/12345.jpg'
    
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
  urlPath: string,
): Promise<void> => {
  await prisma.payment.update({
    where: { payment_id },
    data: { proof_of_transfer: urlPath },
  });
};
