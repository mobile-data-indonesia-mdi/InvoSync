import type { Request, Response } from 'express';
import {
  getAllInvoiceService,
  createInvoiceService,
  getInvoiceByIdService,
  updateInvoiceByIdService,
  deleteInvoiceByIdService,
} from '@services/invoice.service';
import { parseZodError, ResponseHelper } from '@utils/ResponseHelper';
import {
  invoiceWithDetailsRequestSchema,
  invoiceWithDetailsUpdateSchema,
} from '@models/invoice.model';
import type { LogRequestSchema } from '@models/log.model';
import { createLogService } from '@services/log.service';
import { ZodError } from 'zod';

export const getAllInvoiceController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const invoices = await getAllInvoiceService();
    
    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', invoices);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};

export const createInvoiceController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const validate = await invoiceWithDetailsRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const parsed = parseZodError(validate.error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', parsed);
    }

    const invoice = await createInvoiceService(validate.data);
    
    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully created' };
    await createLogService(logData);

    return ResponseHelper(res, 'success', 201,  'Data successfully created', invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};

export const getInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const invoice_id = req.params.id;
    if (!invoice_id) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const invoice = await getInvoiceByIdService(invoice_id);
    
    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};

export const updateInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const invoice_id = req.params.id;

    if (!invoice_id) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);
            
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const validate = await invoiceWithDetailsUpdateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const parsed = parseZodError(validate.error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', parsed);
    }

    const invoice = await updateInvoiceByIdService(invoice_id, validate.data);
    
    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully updated' };
    await createLogService(logData);

    return ResponseHelper(res, 'success', 200,  'Data Successfully updated', invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};

export const deleteInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const invoice_id = req.params.id;
    if (!invoice_id) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }
    await deleteInvoiceByIdService(invoice_id);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully deleted' };
    await createLogService(logData);
    
    return ResponseHelper(res, 'success', 204,  'Data successfully deleted', null);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};
