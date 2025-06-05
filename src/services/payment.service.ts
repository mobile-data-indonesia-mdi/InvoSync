import { prisma } from '@config/db';
import { type PaymentRequestSchema, type PaymentUpdateRequestSchema } from '@models/payment.model';
import type { Prisma } from '@prisma/client';
import {
  getInvoiceByInvoiceNumberService,
  updateInvoiceColAmountPaidService,
} from '@services/invoice.service';
import fs from 'fs';
import path from 'path';
import HttpError from '@utils/httpError';

export const createPaymentService = async (
  paymentData: PaymentRequestSchema,
  file: Express.Multer.File | undefined,
) => {
  try {
    const invoiceData = await getInvoiceByInvoiceNumberService(paymentData.invoice_number);
    if (invoiceData.payment_status === 'paid') {
      throw new HttpError(
        `Client sudah membayar semua tagihan pada invoice ${paymentData.invoice_number}`,
        409,
      );
    }

    if (!file) {
      throw new HttpError('File proof of transfer is required', 400);
    }

    const createdPayment = await prisma.$transaction(async tx => {
      // Create payment from user inputs
      const payment = await tx.payment.create({
        data: {
          payment_date: paymentData.payment_date,
          amount_paid: paymentData.amount_paid,
          proof_of_transfer: paymentData.proof_of_transfer,
          voided_at: paymentData.voided_at,
          invoice_id: invoiceData.invoice_id,
          invoice_number: paymentData.invoice_number,
        },
      });

      // Update invoice amount paid and payment status
      await updateInvoiceColAmountPaidService(tx, invoiceData.invoice_id);

      return payment;
    });

    if (createdPayment.payment_id) {
      const urlPath = path.join('payments/upload', _renameFile(file, createdPayment.payment_id));
      await _updateProofOfTransferService(createdPayment.payment_id, urlPath); // Update path file di database
    }

    return await getPaymentByIdService(createdPayment.payment_id);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getAllPaymentService = async () => {
  try {
    const payment = await prisma.payment.findMany({
      orderBy: {
        payment_date: 'asc',
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
    });

    return payment;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getPaymentByIdService = async (payment_id: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: {
        payment_id,
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!payment) {
      throw new HttpError(`Payment not found`, 404);
    }

    return payment;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    console.error('Error Payment: ', error);
    throw new HttpError('Internal Server Error', 500);
  }
};

export const editPaymentService = async (
  paymentId: string,
  updatedPaymentData: PaymentUpdateRequestSchema,
  uploadedFile: Express.Multer.File | null,
) => {
  try {
    const existingPayment = await prisma.payment.findUnique({
      where: { payment_id: paymentId },
    });

    if (!existingPayment) {
      throw new HttpError('Payment not found', 404);
    }

    const {
      invoice_id: currentInvoiceId,
      amount_paid: currentAmountPaid,
      voided_at: currentVoidedAt,
      proof_of_transfer: currentProofOfTransfer,
    } = existingPayment;

    const newInvoiceId = updatedPaymentData.invoice_number
      ? (await getInvoiceByInvoiceNumberService(updatedPaymentData.invoice_number)).invoice_id
      : currentInvoiceId;

    const updatedProofOfTransfer = uploadedFile
      ? path.join('payments/upload', _renameFile(uploadedFile, paymentId))
      : currentProofOfTransfer;

    if (updatedProofOfTransfer !== currentProofOfTransfer) {
      _deleteFile(currentProofOfTransfer);
    }

    const updatedPayment = await prisma.$transaction(async transaction => {
      const updatePayload = {
        ...updatedPaymentData,
        invoice_id: newInvoiceId,
        proof_of_transfer: updatedProofOfTransfer,
      };

      const updatedPaymentRecord = await transaction.payment.update({
        where: { payment_id: paymentId },
        data: updatePayload,
      });

      if (currentInvoiceId !== newInvoiceId) {
        await updateInvoiceColAmountPaidService(transaction, currentInvoiceId);
        await updateInvoiceColAmountPaidService(transaction, newInvoiceId);
      } else if (
        currentAmountPaid !== updatedPaymentData.amount_paid ||
        currentVoidedAt !== updatedPaymentData.voided_at
      ) {
        await updateInvoiceColAmountPaidService(transaction, currentInvoiceId);
      }

      return updatedPaymentRecord;
    });

    return updatedPayment;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getProofPaymentService = async (payment_filename: string) => {
  try {
    const proofOfTransferPath = path.resolve('uploads/payments', payment_filename); // example path: 'uploads/payments/12345.jpg'
    return proofOfTransferPath;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

// Update proof_of_transfer di database
const _updateProofOfTransferService = async (
  payment_id: string,
  urlPath: string,
): Promise<void> => {
  try {
    await prisma.payment.update({
      where: { payment_id },
      data: { proof_of_transfer: urlPath },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const togglePaymentVoidStatusService = async (payment_id: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { payment_id },
    });

    if (!payment) {
      throw new HttpError('Payment not found', 404);
    }

    const updatedPayment = await prisma.$transaction(async transaction => {
      const updatedPaymentRecord = await transaction.payment.update({
        where: { payment_id },
        data: {
          voided_at: payment.voided_at ? null : new Date(),
        },
      });

      // Update invoice amount paid if voiding the payment
      if (!payment.voided_at) {
        await updateInvoiceColAmountPaidService(transaction, payment.invoice_id);
      }

      return updatedPaymentRecord;
    });

    return updatedPayment;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

// export const deletePaymentByIdService = async (payment_id: string) => {
//   try {
//     const payment = await prisma.payment.findUnique({
//       where: {
//         payment_id,
//       },
//     });

//     if (!payment) {
//       throw new HttpError('Payment not found', 404);
//     }

//     const invoiceID = payment.invoice_id;
//     const proofOfTransferPath = payment.proof_of_transfer;

//     // Hapus payment dari database
//     const deletedPayment = await prisma.$transaction(async tx => {
//       const deleted = await tx.payment.delete({
//         where: { payment_id },
//       });
//       await updateInvoiceColAmountPaidService(tx, invoiceID);

//       return deleted;
//     });

//     if (proofOfTransferPath) {
//       _deleteFile(proofOfTransferPath);
//     }

//     return deletedPayment;
//   } catch (error) {
//     if (error instanceof HttpError) {
//       throw error;
//     }

//     throw new HttpError('Internal Server Error', 500);
//   }
// };

const _renameFile = (file: Express.Multer.File, payment_id: string): string => {
  //Untuk rename saja
  const tempFilePath = file.path;
  const fileExtension = file.mimetype.split('/')[1];
  const renamedFileName = `${payment_id}.${fileExtension}`;
  const renamedFilePath = path.join(path.dirname(tempFilePath), renamedFileName);

  const absoluteRenamedPath = path.resolve(renamedFilePath);
  const absoluteTempPath = path.resolve(tempFilePath);
  fs.renameSync(absoluteTempPath, absoluteRenamedPath);

  if (!fs.existsSync(absoluteRenamedPath)) {
    throw new HttpError('Error renaming file', 500);
  }
  return renamedFileName;
};

const _deleteFile = (filePath: string): void => {
  const fileName = filePath.split('\\').pop(); // Get the file name from the path
  if (!fileName) {
    throw new HttpError('File name is undefined', 400);
  }
  const absoluteFilePath = path.resolve('uploads/payments', fileName);

  if (fs.existsSync(absoluteFilePath)) {
    fs.unlinkSync(absoluteFilePath);
  } else {
    throw new HttpError('File not found', 404);
  }
};

// Invoice service -> Payment service
// Update invoice_number pada payment berdasarkan invoice_id
export const updatePaymentColInvoiceNumberService = async (
  tx: Prisma.TransactionClient,
  invoice_id: string,
  invoice_number: string,
) => {
  try {
    await prisma.payment.updateMany({
      where: { invoice_id },
      data: { invoice_number },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};
