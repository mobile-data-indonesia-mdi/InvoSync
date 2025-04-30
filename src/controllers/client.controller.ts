import type { Request, Response } from 'express';
import {
  getAllClientService,
  createClientService,
  getClientByIdService,
  editClientByIdService,
  deleteClientByIdService,
} from '@services/client.service';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import { clientRequestSchema } from '@models/client.model';
import type { LogRequestSchema } from '@models/log.model';
import { createLogService } from '@services/log.service';

/**
 * @openapi
 * /clients:
 *   get:
 *     summary: Get all clients in the system
 *     tags:
 *       - Clients
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data successfully retrieved
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: ABC Corp
 *                       email:
 *                         type: string
 *                         example: abc@corporation.com
 *                       phone:
 *                         type: string
 *                         example: +1234567890
 *       404:
 *         description: No clients found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No content to display
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const getAllClientController = async (_req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {
    ip: _req.ip || 'unknown',
    access_token: _req.cookies['accessToken'],
    method: _req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: _req.originalUrl,
    payload: _req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    const clients = await getAllClientService();

    if (!clients || clients.length === 0) {
      logData = { ...logData, status: 'SUCCESS', status_message: 'No content to display' };
      await createLogService(logData);

      responseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    responseHelper(res, 'success', 200, 'Data successfully retrieved', clients);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /clients:
 *   post:
 *     summary: Create a new client in the system
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: XYZ Ltd
 *               email:
 *                 type: string
 *                 example: xyz@company.com
 *               phone:
 *                 type: string
 *                 example: +0987654321
 *             required:
 *               - name
 *               - email
 *               - phone
 *     responses:
 *       201:
 *         description: Client successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data successfully created
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: XYZ Ltd
 *                     email:
 *                       type: string
 *                       example: xyz@company.com
 *                     phone:
 *                       type: string
 *                       example: +0987654321
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const createClientController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };

  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);

    const parsed = parseZodError(validate.error);
    responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const newClient = await createClientService(validate.data);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully created' };
    await createLogService(logData);

    responseHelper(res, 'success', 201, 'Data successfully created', newClient);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /clients/{id}:
 *   get:
 *     summary: Get client details by ID
 *     tags:
 *       - Clients
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the client to retrieve
 *         schema:
 *           type: string
 *           example: '123'
 *     responses:
 *       200:
 *         description: Successfully retrieved the client data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data successfully retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     name:
 *                       type: string
 *                       example: XYZ Ltd
 *                     email:
 *                       type: string
 *                       example: xyz@company.com
 *                     phone:
 *                       type: string
 *                       example: +0987654321
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid parameters
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No content to display
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const getClientByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };

  const clientId = req.params.id;

  if (!clientId) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);

    responseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  try {
    const client = await getClientByIdService(clientId);

    if (!client) {
      logData = { ...logData, status: 'SUCCESS', status_message: 'No content to display' };
      await createLogService(logData);

      responseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    responseHelper(res, 'success', 200, 'Data successfully retrieved', client);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /clients/{id}:
 *   put:
 *     summary: Update a client details by ID
 *     tags:
 *       - Clients
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the client to update
 *         schema:
 *           type: string
 *           example: '123'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: XYZ Ltd
 *               email:
 *                 type: string
 *                 example: xyz@company.com
 *               phone:
 *                 type: string
 *                 example: +0987654321
 *             required:
 *               - name
 *               - email
 *               - phone
 *     responses:
 *       200:
 *         description: Client data successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data Successfully updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     name:
 *                       type: string
 *                       example: XYZ Ltd
 *                     email:
 *                       type: string
 *                       example: xyz@company.com
 *                     phone:
 *                       type: string
 *                       example: +0987654321
 *       400:
 *         description: Invalid parameters or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid parameters
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No content to display
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const editClientByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };

  const clientId = req.params.id;

  if (!clientId) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);

    responseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);

    const parsed = parseZodError(validate.error);
    responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const updatedClient = await editClientByIdService(clientId, validate.data);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully updated' };
    await createLogService(logData);

    responseHelper(res, 'success', 200, 'Data Successfully updated', updatedClient);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const deleteClientByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };

  const clientId = req.params.id;

  if (!clientId) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);
    responseHelper(res, 'success', 400, 'Invalid parameters', null);
    return;
  }

  try {
    const deletedClient = await deleteClientByIdService(clientId);
    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully deleted' };
    await createLogService(logData);

    // Menggunakan responseHelper untuk konsistensi response
    responseHelper(res, 'success', 204, 'Data successfully deleted', deletedClient);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};
