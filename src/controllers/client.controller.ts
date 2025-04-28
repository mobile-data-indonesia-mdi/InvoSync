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
