import type { Request, Response } from 'express';
import { paymentRequestSchema, paymentUpdateRequestSchema } from '@models/payment.model';
import {
  createPaymentService,
  getAllPaymentService,
  getPaymentByClientService,
  getPaymentByIdService,
  editPaymentService,
  deletePaymentByIdService,
  getProofPaymentService,
  // restorePaymentService,
} from '@services/payment.service';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import type { LogRequestSchema } from '@models/log.model';
import { createLogService } from '@services/log.service';
import { ZodError } from 'zod';
import path from 'path';
import fs from 'fs';

export const createPaymentController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    // Parse from multipart/form-data
    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    }

    if (!req.body.proof_of_transfer && req.file) {
      req.body.proof_of_transfer = `payment/upload/${req.file.filename}`;
    }

    const validate = await paymentRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const payment = await createPaymentService(validate.data, req.file!);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully created' };
    await createLogService(logData);

    return responseHelper(res, 'success', 201, 'Data successfully created', payment);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    }
  }
};

export const getAllPaymentController = async (req: Request, res: Response) => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    const payments = await getAllPaymentService();

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payments);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    }
  }
};

export const getPaymentByClientController = async (req: Request, res: Response) => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    const { clientId } = req.params;

    if (!clientId) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Client ID is required',
      });
    }

    const payment = await getPaymentByClientService(clientId);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payment);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    }
  }
};

export const getPaymentByIdController = async (req: Request, res: Response) => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    const payment = await getPaymentByIdService(payment_id);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
    await createLogService(logData);

    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payment);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    }
  }
};

export const editPaymentController = async (req: Request, res: Response) => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    const payment_id = req.params.id;
    if (!payment_id) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    // Parse from multipart/form-data
    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    }

    const validate = await paymentUpdateRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const payment = await editPaymentService(payment_id, validate.data, req.file);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully updated' };
    await createLogService(logData);

    return responseHelper(res, 'success', 201, 'Data Successfully updated', payment);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    }
  }
};

export const deletePaymentController = async (req: Request, res: Response) => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    await deletePaymentByIdService(payment_id);

    logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully deleted' };
    await createLogService(logData);

    return responseHelper(res, 'success', 204, 'Data successfully deleted', null);
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    }
  }
};

export const getProofPaymentController = async (req: Request, res: Response) => {
  let logData: LogRequestSchema = {
    ip: req.ip || 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: req.originalUrl,
    payload: req.body,
    status: '' as 'SUCCESS' | 'ERROR',
    status_message: '',
  };
  try {
    const filename = req.params.filename;
    if (!filename) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment Filename is required',
      });
    }

    const filePath = await getProofPaymentService(filename);
    const safePath = path.resolve(filePath);
    const baseDir = path.resolve('uploads', 'payments');

    // Validasi agar file berada dalam folder yang benar (mencegah directory traversal)
    if (!safePath.startsWith(baseDir)) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      return responseHelper(
        res,
        'error',
        403,
        'You do not have permission to access this resource',
        null,
      );
    }

    // Periksa apakah file ada
    if (!fs.existsSync(safePath)) {
      logData = { ...logData, status: 'ERROR', status_message: 'Data not found' };
      await createLogService(logData);

      return responseHelper(res, 'error', 404, 'Data not found', { message: 'File not found' });
    }

    res.sendFile(safePath, async err => {
      if (err) {
        console.error('Error sending file:', err);
        logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
        await createLogService(logData);

        return responseHelper(res, 'error', 500, 'Internal server error', {
          error: 'Error sending file',
        });
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
      await createLogService(logData);

      const formattedError = parseZodError(error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
    } else {
      logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
      await createLogService(logData);

      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return responseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    }
  }
};

// export const restorePaymentController = async (req: Request, res: Response) => {
//   let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
//   try {
//     const payment_id = req.params.id;

//     if (!payment_id) {
//       logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
//       await createLogService(logData);

//       return responseHelper(res, 'error', 400, 'Invalid parameters', {
//         message: 'Payment ID is required'
//       });
//     }

//     const voidPayment = await restorePaymentService(payment_id);
//     logData = { ...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved' };
//     await createLogService(logData);

//     return responseHelper(res, 'success', 200,  'Data successfully retrieved', voidPayment);
//   } catch (error) {
//     if (error instanceof ZodError) {
//       logData = { ...logData, status: 'ERROR', status_message: 'Invalid parameters' };
//       await createLogService(logData);

//       const formattedError = parseZodError(error);
//       return responseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
//     } else {
//       logData = { ...logData, status: 'ERROR', status_message: 'Internal server error' };
//       await createLogService(logData);

//       const errorMessage = error instanceof Error ? error.message : 'Internal server error';
//       return responseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
//     }
//   }
// };
