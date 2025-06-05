import type { Request, Response } from 'express';
import { paymentRequestSchema, paymentUpdateRequestSchema } from '@models/payment.model';
import {
  createPaymentService,
  getAllPaymentService,
  getPaymentByIdService,
  editPaymentService,
  getProofPaymentService,
  togglePaymentVoidStatusService,
} from '@services/payment.service';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import log from '@utils/logs';
import path from 'path';
import fs from 'fs';
import HttpError from '@utils/httpError';

/**
 * @swagger
 * components:
 *  schemas:
 *    Payment:
 *      type: object
 *      properties:
 *        payment_id:
 *          type: string
 *          format: uuid
 *          description: Identitas unik untuk pembayaran
 *        payment_date:
 *          type: string
 *          format: date
 *          description: Tanggal pembayaran
 *        amount_paid:
 *          type: number
 *          format: double
 *          description: Jumlah yang dibayarkan
 *        proof_of_transfer:
 *          type: string
 *          format: binary
 *          description: Bukti transfer pembayaran
 *        voided_at:
 *          type: string
 *          format: date-time
 *          nullable: true
 *          description: Tanggal pembayaran dijadikan void
 *        created_at:
 *          type: string
 *          format: date-time
 *          description: Tanggal pembayaran dibuat
 *        updated_at:
 *          type: string
 *          format: date-time
 *          description: Tanggal pembayaran diperbarui
 *        invoice_id:
 *          type: string
 *          format: uuid
 *          description: Identitas unik untuk invoice yang terkait dengan pembayaran
 *        invoice_number:
 *          type: string
 *          format: string
 *          description: Nomor invoice yang terkait dengan pembayaran
 *      example:
 *        payment_id: "123e4567-e89b-12d3-a456-426614174000"
 *        payment_date: "2024-05-01"
 *        amount_paid: 1000
 *        proof_of_transfer: "payments/upload/123e4567-e89b-12d3-a456-426614174000.jpg"
 *        voided_at: null
 *        created_at: "2024-05-01T12:00:00Z"
 *        updated_at: "2024-05-01T12:00:00Z"
 *        invoice_id: "987e6543-e21b-12d3-a456-426614174000"
 *        invoice_number: "INV-2024-001"
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Membuat payment baru
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-01"
 *               amount_paid:
 *                 type: number
 *                 example: 1000
 *               proof_of_transfer:
 *                 type: string
 *                 format: binary
 *               invoice_number:
 *                 type: string
 *                 example: "INV-2024-001"
 *     responses:
 *       201:
 *         description: Payment berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Data successfully created
 *                 data:
 *                   type: object
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: object
 *                   example: { field: "proof_of_transfer", message: "Proof of transfer is required" }
 *       404:
 *         description: Invoice untuk pembayaran tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Invoice with number INV-2024-001 not found
 *                 data:
 *                   type: "null"
 *       409:
 *         description: Konflik pembayaran (contoh, invoice sudah dibayar)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: Client sudah membayar semua tagihan pada invoice INV-2024-001
 *                 data:
 *                   type: "null"
 *       500:
 *         description: Kesalahan server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: "null"
 *
 */
export const createPaymentController = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    }

    if (!req.body.proof_of_transfer && req.file) {
      req.body.proof_of_transfer = `payments/upload/${req.file.filename}`;
    }

    const validate = await paymentRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Create Payment - Invalid parameters');
      const parsedError = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsedError);
    }

    const payment = await createPaymentService(validate.data, req.file!);
    req.body.proof_of_transfer = payment.proof_of_transfer;

    await log(req, 'SUCCESS', 'Create Payment - Data successfully created');
    return responseHelper(res, 'success', 201, 'Data successfully created', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Mendapatkan semua pembayaran
 *     tags:
 *      - Payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data successfully retrieved
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       500:
 *         description: Kesalahan server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: "null"
 */
export const getAllPaymentController = async (req: Request, res: Response) => {
  try {
    const payments = await getAllPaymentService();
    if (!payments || payments.length === 0) {
      await log(req, 'SUCCESS', 'No content to display');
      responseHelper(res, 'success', 200, 'No content to display', null);
      return;
    }

    await log(req, 'SUCCESS', 'Get All Payments - Data successfully retrieved');
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payments);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Mendapatkan pembayaran berdasarkan ID
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID pembayaran yang ingin diambil
 *     responses:
 *       200:
 *         description: Pembayaran berhasil ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data successfully retrieved
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: object
 *                   example:
 *                     message: "Payment ID is required"
 *       404:
 *         description: Pembayaran tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "Payment not found for ID: 123e4567-e89b-12d3-a456-426614174000"
 *                 data:
 *                   type: "null"
 *       500:
 *         description: Kesalahan server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: "null"
 */
export const getPaymentByIdController = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId) {
      await log(req, 'ERROR', 'Get Payment By ID - Payment ID is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    const payment = await getPaymentByIdService(paymentId);
    if (!payment) {
      await log(req, 'ERROR', 'Payment not found for ID: ' + paymentId);
      responseHelper(res, 'error', 404, 'Payment not found for ID: ' + paymentId, null);
      return;
    }

    await log(req, 'SUCCESS', 'Get Payment By ID - Data successfully retrieved');
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Mengedit pembayaran berdasarkan ID
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID pembayaran yang ingin diedit
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               payment_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2024-05-01"
 *               amount_paid:
 *                 type: number
 *                 nullable: true
 *                 example: 1000
 *               proof_of_transfer:
 *                 type: string
 *                 nullable: true
 *                 format: binary
 *               invoice_number:
 *                 type: string
 *                 nullable: true
 *                 example: "INV-2024-001"
 *               voided_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *
 *     responses:
 *       201:
 *         description: Pembayaran berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Data successfully updated
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: object
 *                   example: { field: "amount_paid", message: "Expected number, received nan" }
 *       404:
 *         description: Pembayaran tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Payment not found
 *                 data:
 *                   type: "null"
 *       409:
 *         description: Konflik pembayaran (contoh, lebih bayar dari total tagihan pada invoice)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: Overpayment detected
 *                 data:
 *                   type: "null"
 *       500:
 *         description: Kesalahan server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: "null"
 */
export const editPaymentController = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId) {
      await log(req, 'ERROR', 'Edit Payment - Payment ID is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    }

    const validate = await paymentUpdateRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Edit Payment - Invalid parameters');
      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const payment = await editPaymentService(paymentId, validate.data, req.file ?? null);
    req.body.proof_of_transfer = payment.proof_of_transfer;

    await log(req, 'SUCCESS', 'Edit Payment - Data successfully updated');
    return responseHelper(res, 'success', 201, 'Data successfully updated', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

/**
 * @swagger
 * /payments/upload/{filename}:
 *   get:
 *     summary: Mendapatkan bukti pembayaran berdasarkan nama file
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: filename
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Nama file bukti pembayaran yang ingin diambil
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil ditemukan dan dikirimkan
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: object
 *                   example: { message: "Payment Filename is required" }
 *       403:
 *         description: Akses tidak diizinkan untuk file ini
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 403
 *                 message:
 *                   type: string
 *                   example: You do not have permission to access this resource
 *                 data:
 *                   type: "null"
 *       404:
 *         description: File tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Data not found
 *                 data:
 *                   type: object
 *                   example: { message: "File not found" }
 *       500:
 *         description: Kesalahan server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: "null"
 */
export const getProofPaymentController = async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;

    if (!filename) {
      await log(req, 'ERROR', 'Get Proof of Payment - Filename is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment Filename is required',
      });
    }

    const filePath = await getProofPaymentService(filename);
    const safePath = path.resolve(filePath);
    const baseDir = path.resolve('uploads', 'payments');

    if (!safePath.startsWith(baseDir)) {
      await log(req, 'ERROR', 'Get Proof of Payment - Unauthorized access attempt');
      return responseHelper(
        res,
        'error',
        403,
        'You do not have permission to access this resource',
        null,
      );
    }

    if (!fs.existsSync(safePath)) {
      await log(req, 'ERROR', 'Get Proof of Payment - File not found');
      return responseHelper(res, 'error', 404, 'Data not found', { message: 'File not found' });
    }

    res.sendFile(safePath, async err => {
      if (err) {
        await log(req, 'ERROR', 'Get Proof of Payment - Error sending file');
        return responseHelper(res, 'error', 500, 'Internal server error', {
          error: 'Error sending file',
        });
      }
    });

    await log(req, 'SUCCESS', 'Get Proof of Payment - File successfully sent');
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

/**
 * @swagger
 * /payments/{id}/void-status:
 *   patch:
 *     summary: Mengubah status void pembayaran berdasarkan ID
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID pembayaran yang ingin diubah status void-nya
 *     responses:
 *       201:
 *         description: Status void pembayaran berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Data successfully updated
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: object
 *                   example: { message: "Payment ID is required" }
 *       404:
 *         description: Pembayaran tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "Payment not found for ID: 123e4567-e89b-12d3-a456-426614174000"
 *                 data:
 *                   type: "null"
 *       500:
 *         description: Kesalahan server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: "null"
 */
export const togglePaymentVoidStatusController = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId) {
      await log(req, 'ERROR', 'Toggle Payment Void Status - Payment ID is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    const payment = await togglePaymentVoidStatusService(paymentId);
    if (!payment) {
      await log(req, 'ERROR', 'Payment not found for ID: ' + paymentId);
      responseHelper(res, 'error', 404, 'Payment not found for ID: ' + paymentId, null);
      return;
    }

    await log(req, 'SUCCESS', 'Toggle Payment Void Status - Data successfully updated');
    return responseHelper(res, 'success', 201, 'Data successfully updated', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

// export const deletePaymentController = async (req: Request, res: Response) => {
//   try {
//     const paymentId = req.params.id;
//     if (!paymentId) {
//       await log(req, 'ERROR', 'Delete Payment - Payment ID is required');
//       return responseHelper(res, 'error', 400, 'Invalid parameters', {
//         message: 'Payment ID is required',
//       });
//     }
//     await deletePaymentByIdService(paymentId);
//     await log(req, 'SUCCESS', 'Delete Payment - Data successfully deleted');
//     return responseHelper(res, 'success', 204, 'Data successfully deleted', null);
//   } catch (error) {
//     const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
//     const statusCode = error instanceof HttpError ? error.statusCode : 500;
//     await log(req, 'ERROR', errorMessage);
//     responseHelper(res, 'error', statusCode, errorMessage, null);
//   }
// };
