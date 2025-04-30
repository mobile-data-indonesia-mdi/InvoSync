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

export const getAllClientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = await getAllClientService();

    if (!clients || clients.length === 0) {
      await log(req, 'SUCCESS', 'No content to display');
      responseHelper(res, 'success', 404, 'No content to display', null);
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
      await log(req, 'SUCCESS', 'No content to display');
      responseHelper(res, 'success', 404, 'No content to display', null);
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
