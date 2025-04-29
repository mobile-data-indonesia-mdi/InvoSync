import type { Request, Response } from 'express';
import {
  getAllClientService,
  createClientService,
  getClientByIdService,
  editClientByIdService,
  deleteClientByIdService,
} from '@services/client.service';
import { parseZodError, ResponseHelper } from '@utils/ResponseHelper';
import { clientRequestSchema } from '@models/client.model';

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
  try {
    const clients = await getAllClientService();

    if (!clients || clients.length === 0) {
      ResponseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', clients);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
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
  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    const parsed = parseZodError(validate.error);
    ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const newClient = await createClientService(validate.data);

    ResponseHelper(res, 'success', 201, 'Data successfully created', newClient);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
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
  const clientId = req.params.id;

  if (!clientId) {
    ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  try {
    const client = await getClientByIdService(clientId);

    if (!client) {
      ResponseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', client);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
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
  const clientId = req.params.id;

  if (!clientId) {
    ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    const parsed = parseZodError(validate.error);
    ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const updatedClient = await editClientByIdService(clientId, validate.data);

    ResponseHelper(res, 'success', 200, 'Data Successfully updated', updatedClient);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const deleteClientByIdController = async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.id;

  if (!clientId) {
    ResponseHelper(res, 'success', 400, 'Invalid parameters', null);
    return;
  }

  try {
    const deletedClient = await deleteClientByIdService(clientId);

    // Menggunakan ResponseHelper untuk konsistensi response
    ResponseHelper(res, 'success', 204, 'Data successfully deleted', deletedClient);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};
