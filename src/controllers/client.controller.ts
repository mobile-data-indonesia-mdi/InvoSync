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
import type { LogRequestSchema } from '@models/log.model';
import { createLogService } from '@services/log.service';

export const getAllClientController = async (_req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: _req.ip || 'unknown', access_token: _req.cookies['accessToken'], method: _req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: _req.originalUrl, payload: _req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const clients = await getAllClientService();

    if (!clients || clients.length === 0) {
      logData = { ...logData, status: 'SUCCESS', status_message: 'No content to display' };
      await createLogService(logData);

      ResponseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', clients);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const createClientController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  
  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);

    const parsed = parseZodError(validate.error);
    ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const newClient = await createClientService(validate.data);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully created' };
    await createLogService(logData);

    ResponseHelper(res, 'success', 201, 'Data successfully created', newClient);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const getClientByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};

  const clientId = req.params.id;

  if (!clientId) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' }; 
    await createLogService(logData);

    ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  try {
    const client = await getClientByIdService(clientId);

    if (!client) {
      logData = { ...logData, status: 'SUCCESS', status_message: 'No content to display' };
      await createLogService(logData);

      ResponseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }
    
    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', client);
    return;
  } catch (error) {
		logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const editClientByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};

  const clientId = req.params.id;

  if (!clientId) {
		logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);

    ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
    return;
  }

  const validate = await clientRequestSchema.safeParseAsync(req.body);

  if (!validate.success) {
		logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);

    const parsed = parseZodError(validate.error);
    ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    return;
  }

  try {
    const updatedClient = await editClientByIdService(clientId, validate.data);

		logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully updated' };
    await createLogService(logData);

    ResponseHelper(res, 'success', 200, 'Data Successfully updated', updatedClient);
    return;
  } catch (error) {  
		logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const deleteClientByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};

  const clientId = req.params.id;

  if (!clientId) {
    logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
    await createLogService(logData);
    ResponseHelper(res, 'success', 400, 'Invalid parameters', null);
    return;
  }

  try {
    const deletedClient = await deleteClientByIdService(clientId);
    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully deleted' };
    await createLogService(logData);
    
    // Menggunakan ResponseHelper untuk konsistensi response
    ResponseHelper(res, 'success', 204, 'Data successfully deleted', deletedClient);
    return;
  } catch (error) {
    logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};
