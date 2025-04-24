import type { Request, Response } from 'express';
import {
  getAllClientService,
  createClientService,
  getClientByIdService,
  updateClientByIdService,
  deleteClientByIdService,
} from '@services/client.service';
import { parseZodError } from 'src/utils/ResponseHelper';
import { clientRequestSchema } from '@models/client.model';

export const getAllClientController = async (_req: Request, res: Response): Promise<void> => {
  console.log('getAllClientController called');
  try {
    const clients = await getAllClientService();

    if (!clients || clients.length === 0) {
      res.status(404).json({ message: 'Client tidak ditemukan' });
      return;
    }

    res.status(200).json(clients);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

export const createClientController = async (req: Request, res: Response): Promise<void> => {
  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    const parsed = parseZodError(validate.error);
    res.status(400).json(parsed);
    return;
  }

  try {
    const newClient = await createClientService(validate.data);

    res.status(201).json(newClient);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

export const getClientByIdController = async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.id;

  if (!clientId) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }

  try {
    const client = await getClientByIdService(clientId);

    if (!client) {
      res.status(404).json({ message: 'Client tidak ditemukan' });
      return;
    }

    res.status(200).json(client);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

export const updateClientByIdController = async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.id;

  if (!clientId) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }

  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    const parsed = parseZodError(validate.error);
    res.status(400).json(parsed);
    return;
  }

  try {
    const updatedClient = await updateClientByIdService(clientId, validate.data);

    res.status(200).json(updatedClient);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};
export const deleteClientByIdController = async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.id;

  if (!clientId) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }

  try {
    const deletedClient = await deleteClientByIdService(clientId);

    res.status(200).json(deletedClient);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};
