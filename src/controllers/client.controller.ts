import type { Request, Response } from 'express';

import { clientRequestSchema } from '@models/client.model';
import {
  getAllClientService,
  createClientService,
  getClientByIdService,
  editClientByIdService,
  // deleteClientByIdService,
} from '@services/client.service';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import HttpError from '@utils/httpError';
import log from '@utils/logs';

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Membuat client baru
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     description: Endpoint untuk membuat data client baru. Hanya dapat diakses oleh user dengan role `finance`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *               - currency
 *               - country
 *               - client_address
 *               - postal_code
 *               - client_phone
 *             properties:
 *               client_name:
 *                 type: string
 *                 example: chonryy
 *               currency:
 *                 type: string
 *                 example: USD
 *               country:
 *                 type: string
 *                 example: China
 *               client_address:
 *                 type: string
 *                 example: pondok jagung
 *               postal_code:
 *                 type: string
 *                 example: "10100"
 *               client_phone:
 *                 type: string
 *                 example: "62123412341234"
 *     responses:
 *       201:
 *         description: Client berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Data successfully created
 *                 data:
 *                   type: object
 *                   properties:
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
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       409:
 *         description: Client sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Client already exists
 *                 data:
 *                   type: object
 *                   nullable: true
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
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: object
 *                   nullable: true
 */
export const createClientController = async (req: Request, res: Response): Promise<void> => {
  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    await log(req, 'ERROR', 'Invalid parameters');
    const parsed = parseZodError(validate.error);
    responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const newClient = await createClientService(validate.data);
    await log(req, 'SUCCESS', 'Data successfully created');
    responseHelper(res, 'success', 201, 'Data successfully created', newClient);
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
 * /clients:
 *   get:
 *     summary: Mendapatkan semua data client
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     description: Mengambil seluruh data client yang tersedia. Hanya dapat diakses oleh user dengan role `finance` atau `management`.
 *     responses:
 *       200:
 *         description: Data client berhasil diambil
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
 *                       client_id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       client_name:
 *                         type: string
 *                         example: PT Maju Jaya
 *                       currency:
 *                         type: string
 *                         example: USD
 *                       country:
 *                         type: string
 *                         example: Indonesia
 *                       client_address:
 *                         type: string
 *                         example: Jl. Sudirman No.1
 *                       postal_code:
 *                         type: string
 *                         example: "12345"
 *                       client_phone:
 *                         type: string
 *                         example: "+6281234567890"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-01T00:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-02T00:00:00.000Z
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
export const getAllClientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = await getAllClientService();

    if (!clients || clients.length === 0) {
      await log(req, 'SUCCESS', 'No content to display');
      responseHelper(res, 'success', 200, 'No content to display', null);
      return;
    }

    await log(req, 'SUCCESS', 'Data successfully retrieved');
    responseHelper(res, 'success', 200, 'Data successfully retrieved', clients);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Mendapatkan data client berdasarkan ID
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID dari client
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Data client berhasil ditemukan
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
 *                   type: object
 *                   properties:
 *                     client_id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     client_name:
 *                       type: string
 *                       example: PT Maju Jaya
 *                     currency:
 *                       type: string
 *                       example: USD
 *                     country:
 *                       type: string
 *                       example: Indonesia
 *                     client_address:
 *                       type: string
 *                       example: Jl. Sudirman No.1
 *                     postal_code:
 *                       type: string
 *                       example: "12345"
 *                     client_phone:
 *                       type: string
 *                       example: "+6281234567890"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-01T00:00:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-02T00:00:00.000Z
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
 *                   type: "null"
 *       404:
 *         description: Data client tidak ditemukan
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
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "No client found for ID: 123e4567-e89b-12d3-a456-426614174000"
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
export const getClientByIdController = async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.id;

  if (!clientId) {
    await log(req, 'ERROR', 'Invalid parameters');
    responseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  try {
    const client = await getClientByIdService(clientId);

    if (!client) {
      await log(req, 'ERROR', 'No client found for ID: ' + clientId);
      responseHelper(res, 'error', 404, 'No client found for ID: ' + clientId, null);
      return;
    }

    await log(req, 'SUCCESS', 'Data successfully retrieved');
    responseHelper(res, 'success', 200, 'Data successfully retrieved', client);
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
 * /clients/{id}:
 *   put:
 *     summary: Memperbarui data client berdasarkan ID
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID dari client yang ingin diperbarui
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_name:
 *                 type: string
 *                 example: apkwab
 *               currency:
 *                 type: string
 *                 example: USD
 *               country:
 *                 type: string
 *                 example: China
 *               client_address:
 *                 type: string
 *                 example: pondok indah
 *               postal_code:
 *                 type: string
 *                 example: "10100"
 *               client_phone:
 *                 type: string
 *                 example: "62123412341234"
 *     responses:
 *       200:
 *         description: Data client berhasil diperbarui
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
 *                   type: object
 *                   properties:
 *                     client_id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     client_name:
 *                       type: string
 *                       example: apkwab
 *                     currency:
 *                       type: string
 *                       example: USD
 *                     country:
 *                       type: string
 *                       example: China
 *                     client_address:
 *                       type: string
 *                       example: pondok indah
 *                     postal_code:
 *                       type: string
 *                       example: "10100"
 *                     client_phone:
 *                       type: string
 *                       example: "62123412341234"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-01T00:00:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-02T00:00:00.000Z
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
 *                   type: "null"
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
export const editClientByIdController = async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.id;

  if (!clientId) {
    await log(req, 'ERROR', 'Invalid parameters');
    responseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    await log(req, 'ERROR', 'Invalid parameters');
    const parsed = parseZodError(validate.error);
    responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const updatedClient = await editClientByIdService(clientId, validate.data);
    await log(req, 'SUCCESS', 'Data successfully updated');
    responseHelper(res, 'success', 200, 'Data successfully updated', updatedClient);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

// export const deleteClientByIdController = async (req: Request, res: Response): Promise<void> => {
//   const clientId = req.params.id;

//   if (!clientId) {
//     log(req, 'ERROR', 'Invalid parameters');
//     responseHelper(res, 'error', 400, 'Invalid parameters', null);
//     return;
//   }

//   try {
//     await deleteClientByIdService(clientId);
//     log(req, 'SUCCESS', 'Data successfully deleted');
//     responseHelper(res, 'success', 204, 'Data successfully deleted', null);
//   } catch (error) {
//     const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
//     const statusCode = error instanceof HttpError ? error.statusCode : 500;

//     log(req, 'ERROR', errorMessage);
//     responseHelper(res, 'error', statusCode, errorMessage, null);
//     return;
//   }
// };
