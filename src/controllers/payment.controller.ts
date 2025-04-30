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
} from '@services/payment.service';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import log from '@utils/logs';
import path from 'path';
import fs from 'fs';
import HttpError from '@utils/httpError';

export const createPaymentController = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    }

    if (!req.body.proof_of_transfer && req.file) {
      req.body.proof_of_transfer = `payment/upload/${req.file.filename}`;
    }

    const validate = await paymentRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Create Payment - Invalid parameters');
      const parsedError = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsedError);
    }

    const payment = await createPaymentService(validate.data, req.file!);

    await log(req, 'SUCCESS', 'Create Payment - Data successfully created');
    return responseHelper(res, 'success', 201, 'Data successfully created', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

export const getAllPaymentController = async (req: Request, res: Response) => {
  try {
    const payments = await getAllPaymentService();

    await log(req, 'SUCCESS', 'Get All Payments - Data successfully retrieved');
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payments);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

export const getPaymentByClientController = async (req: Request, res: Response) => {
  try {
    const clientId = req.params.id;

    if (!clientId) {
      await log(req, 'ERROR', 'Get Payment By Client - Client ID is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Client ID is required',
      });
    }

    const payment = await getPaymentByClientService(clientId);

    await log(req, 'SUCCESS', 'Get Payment By Client - Data successfully retrieved');
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

export const getPaymentByIdController = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId) {
      await log(req, 'ERROR', 'Get Payment By ID - Payment ID is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    const payment = await getPaymentByIdService(paymentId);

    await log(req, 'SUCCESS', 'Get Payment By ID - Data successfully retrieved');
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

export const editPaymentController = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId) {
      await log(req, 'ERROR', 'Edit Payment - Payment ID is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    }

    const validate = await paymentUpdateRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Edit Payment - Invalid parameters');
      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const payment = await editPaymentService(paymentId, validate.data, req.file);

    await log(req, 'SUCCESS', 'Edit Payment - Data successfully updated');
    return responseHelper(res, 'success', 201, 'Data successfully updated', payment);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

export const deletePaymentController = async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId) {
      await log(req, 'ERROR', 'Delete Payment - Payment ID is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    await deletePaymentByIdService(paymentId);

    await log(req, 'SUCCESS', 'Delete Payment - Data successfully deleted');
    return responseHelper(res, 'success', 204, 'Data successfully deleted', null);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};

export const getProofPaymentController = async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;

    if (!filename) {
      await log(req, 'ERROR', 'Get Proof of Payment - Filename is required');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment Filename is required',
      });
    }

    const filePath = await getProofPaymentService(filename);
    const safePath = path.resolve(filePath);
    const baseDir = path.resolve('uploads', 'payments');

    if (!safePath.startsWith(baseDir)) {
      await log(req, 'ERROR', 'Get Proof of Payment - Unauthorized access attempt');
      return responseHelper(
        res,
        'error',
        403,
        'You do not have permission to access this resource',
        null,
      );
    }

    if (!fs.existsSync(safePath)) {
      await log(req, 'ERROR', 'Get Proof of Payment - File not found');
      return responseHelper(res, 'error', 404, 'Data not found', { message: 'File not found' });
    }

    res.sendFile(safePath, async err => {
      if (err) {
        await log(req, 'ERROR', 'Get Proof of Payment - Error sending file');
        return responseHelper(res, 'error', 500, 'Internal server error', {
          error: 'Error sending file',
        });
      }
    });

    await log(req, 'SUCCESS', 'Get Proof of Payment - File successfully sent');
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
  }
};
