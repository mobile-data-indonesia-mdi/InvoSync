import type { Request, Response } from 'express';

import {
  invoiceWithDetailsCreateSchema,
  invoiceWithDetailsUpdateSchema,
} from '@models/invoice.model';
import {
  getAllInvoiceService,
  createInvoiceService,
  getInvoiceByIdService,
  updateInvoiceByIdService,
  toggleInvoiceVoidStatusService,
} from '@services/invoice.service';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import log from '@utils/logs';
import HttpError from '@utils/httpError';

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Membuat invoice baru beserta detailnya
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoice_number:
 *                 type: string
 *                 example: INV-2024-001
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-05-01
 *               due_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-05-31
 *               tax_rate:
 *                 type: number
 *                 example: 0.1
 *               tax_invoice_number:
 *                 type: string
 *                 example: TAX-INV-001
 *               client_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               invoice_details:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     transaction_note:
 *                       type: string
 *                       example: Pengiriman produk A
 *                     delivery_count:
 *                       type: number
 *                       example: 10
 *                     price_per_delivery:
 *                       type: number
 *                       example: 15000
 *     responses:
 *       201:
 *         description: Invoice berhasil dibuat
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
 *                   example: Successfully created invoice
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoice_id:
 *                       type: string
 *                       format: uuid
 *                       example: 987e6543-e21b-12d3-a456-426614174000
 *                     invoice_number:
 *                       type: string
 *                       example: INV-2024-001
 *                     issue_date:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-05-01T00:00:00.000Z
 *                     due_date:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-05-31T00:00:00.000Z
 *                     sub_total:
 *                       type: number
 *                       example: 150000
 *                     tax_rate:
 *                       type: number
 *                       example: 0.1
 *                     tax_amount:
 *                       type: number
 *                       example: 15000
 *                     total:
 *                       type: number
 *                       example: 165000
 *                     tax_invoice_number:
 *                       type: string
 *                       example: TAX-INV-001
 *                     amount_paid:
 *                       type: number
 *                       example: 0
 *                     payment_status:
 *                       type: string
 *                       enum: [paid, unpaid, partial]
 *                       example: unpaid
 *                     voided_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     client_id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-05-01T10:00:00.000Z
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-05-01T10:00:00.000Z
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
 *                   example: { invoice_number: ["Invoice number is required"] }
 *       404:
 *         description: Client tidak ditemukan
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
 *                   example: Client not found
 *                 data:
 *                   type: "null"
 *       409:
 *         description: Invoice sudah ada
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
 *                   example: Duplicate invoice
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
export const createInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await invoiceWithDetailsCreateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Invalid parameters for creating invoice');
      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const invoice = await createInvoiceService(validate.data);
    await log(req, 'SUCCESS', 'Invoice successfully created');
    return responseHelper(res, 'success', 201, 'Successfully created invoice', invoice);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Mengambil semua data invoice beserta detail dan client
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data invoice berhasil diambil
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
 *                     type: object
 *                     properties:
 *                       invoice_id:
 *                         type: string
 *                         format: uuid
 *                         example: 987e6543-e21b-12d3-a456-426614174000
 *                       invoice_number:
 *                         type: string
 *                         example: INV-2024-001
 *                       issue_date:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-05-01T00:00:00.000Z
 *                       due_date:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-05-31T00:00:00.000Z
 *                       tax_rate:
 *                         type: number
 *                         example: 0.1
 *                       tax_amount:
 *                         type: number
 *                         example: 15000
 *                       sub_total:
 *                         type: number
 *                         example: 150000
 *                       total:
 *                         type: number
 *                         example: 165000
 *                       tax_invoice_number:
 *                         type: string
 *                         example: TAX-INV-001
 *                       amount_paid:
 *                         type: number
 *                         example: 0
 *                       payment_status:
 *                         type: string
 *                         enum: [paid, unpaid, partial]
 *                         example: unpaid
 *                       voided_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       client_id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-05-01T10:00:00.000Z
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-05-01T10:00:00.000Z
 *                       client:
 *                         type: object
 *                         properties:
 *                           client_id:
 *                             type: string
 *                             format: uuid
 *                             example: 123e4567-e89b-12d3-a456-426614174000
 *                           name:
 *                             type: string
 *                             example: PT Maju Jaya
 *                           address:
 *                             type: string
 *                             example: Jl. Contoh No.123
 *                           phone:
 *                             type: string
 *                             example: "08123456789"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                       invoice_details:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             invoice_detail_id:
 *                               type: string
 *                               format: uuid
 *                             transaction_note:
 *                               type: string
 *                               example: Pengiriman barang X
 *                             delivery_count:
 *                               type: number
 *                               example: 10
 *                             price_per_delivery:
 *                               type: number
 *                               example: 15000
 *                             amount:
 *                               type: number
 *                               example: 150000
 *                             invoice_id:
 *                               type: string
 *                               format: uuid
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
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
export const getAllInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await getAllInvoiceService();

    if (!invoices || invoices.length === 0) {
      await log(req, 'SUCCESS', 'No content to display');
      responseHelper(res, 'success', 200, 'No content to display', null);
      return;
    }

    await log(req, 'SUCCESS', 'Invoices successfully retrieved');
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', invoices);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get a single invoice by ID
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the invoice to retrieve
 *     responses:
 *       200:
 *         description: Invoice successfully retrieved
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
 *                   $ref: '#/components/schemas/InvoiceWithClientAndDetails'
 *       400:
 *         description: Missing or invalid invoice ID
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
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Invoice ID is required
 *       404:
 *         description: Invoice not found
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
 *                   example: "Invoice not found for ID: 123e4567-e89b-12d3-a456-426614174000"
 *       500:
 *         description: Internal server error
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
export const getInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      await log(req, 'ERROR', 'Invoice ID is missing');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const invoice = await getInvoiceByIdService(invoiceId);

    if (!invoice) {
      await log(req, 'ERROR', 'Invoice not found for ID: ' + invoiceId);
      responseHelper(res, 'error', 404, 'Invoice not found for ID: ' + invoiceId, null);
      return;
    }

    await log(req, 'SUCCESS', `Invoice with ID: ${invoiceId} successfully retrieved`);
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', invoice);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /invoices/{id}:
 *   put:
 *     summary: Update an invoice by ID
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the invoice to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoice_number
 *               - issue_date
 *               - due_date
 *               - tax_rate
 *               - client_id
 *               - invoice_details
 *             properties:
 *               invoice_number:
 *                 type: string
 *                 example: "6"
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-13"
 *               due_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-13"
 *               tax_rate:
 *                 type: number
 *                 example: 0.2
 *               tax_invoice_number:
 *                 type: string
 *                 example: "123412341234"
 *               voided_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               client_id:
 *                 type: string
 *                 format: uuid
 *                 example: "c3708cee-086e-43ed-8d4a-f2e74598606d"
 *               invoice_details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - transaction_note
 *                     - delivery_count
 *                     - price_per_delivery
 *                   properties:
 *                     invoice_details_id:
 *                       type: string
 *                       format: uuid
 *                       example: "a1acd225-5970-4053-8750-cbf07d21246a"
 *                     transaction_note:
 *                       type: string
 *                       example: "Chonry 1 Mei - 15 Mei 2023"
 *                     delivery_count:
 *                       type: number
 *                       example: 20234
 *                     price_per_delivery:
 *                       type: number
 *                       example: 24
 *                     invoice_id:
 *                       type: string
 *                       example: "123-123-123"
 *     responses:
 *       200:
 *         description: Invoice successfully updated
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
 *                   example: Data successfully updated
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid parameters (e.g., missing fields or invalid input)
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
 *                   example: { field: "client_id", message: "Client ID is required" }
 *       404:
 *         description: Invoice or Client not found
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
 *                   example: Invoice not found
 *       500:
 *         description: Internal server error
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
export const updateInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      await log(req, 'ERROR', 'Invoice ID is missing for update');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const validate = await invoiceWithDetailsUpdateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Invalid parameters for updating invoice');
      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const invoice = await updateInvoiceByIdService(invoiceId, validate.data);
    await log(req, 'SUCCESS', `Invoice with ID: ${invoiceId} successfully updated`);
    return responseHelper(res, 'success', 200, 'Data successfully updated', invoice);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /invoices/{id}/void-status:
 *   patch:
 *     summary: Toggle the void status of an invoice by ID
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the invoice to toggle void status
 *     responses:
 *       200:
 *         description: Invoice void status successfully toggled
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
 *                   example: Data successfully updated
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid parameters
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
 *                   example: { message: "Invoice ID is required" }
 *       404:
 *         description: Invoice not found
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
 *                   example: Invoice not found
 *                 data:
 *                   type: "null"
 *       500:
 *         description: Internal server error
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
export const toggleInvoiceVoidStatusController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      await log(req, 'ERROR', 'Invoice ID is missing for void status toggle');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const invoice = await toggleInvoiceVoidStatusService(invoiceId);
    await log(req, 'SUCCESS', `Invoice with ID: ${invoiceId} void status toggled`);
    return responseHelper(res, 'success', 200, 'Data successfully updated', invoice);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};
