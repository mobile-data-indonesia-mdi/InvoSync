import type { Request, Response } from 'express';

import {
  invoiceWithDetailsCreateSchema,
  invoiceWithDetailsUpdateSchema,
} from '@models/invoice.model';
import {
  getAllInvoiceService,
  createInvoiceService,
  getInvoiceByIdService,
  updateInvoiceByIdService,
} from '@services/invoice.service';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import log from '@utils/logs';
import HttpError from '@utils/httpError';

export const createInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await invoiceWithDetailsCreateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Invalid parameters for creating invoice');
      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const invoice = await createInvoiceService(validate.data);
    await log(req, 'SUCCESS', 'Invoice successfully created');
    return responseHelper(res, 'success', 201, 'Successfully created invoice', invoice);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const getAllInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await getAllInvoiceService();
    await log(req, 'SUCCESS', 'Invoices successfully retrieved');
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', invoices);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const getInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      await log(req, 'ERROR', 'Invoice ID is missing');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const invoice = await getInvoiceByIdService(invoiceId);
    await log(req, 'SUCCESS', `Invoice with ID: ${invoiceId} successfully retrieved`);
    return responseHelper(res, 'success', 200, 'Data successfully retrieved', invoice);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const updateInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      await log(req, 'ERROR', 'Invoice ID is missing for update');
      return responseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const validate = await invoiceWithDetailsUpdateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Invalid parameters for updating invoice');
      const parsed = parseZodError(validate.error);
      return responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const invoice = await updateInvoiceByIdService(invoiceId, validate.data);
    await log(req, 'SUCCESS', `Invoice with ID: ${invoiceId} successfully updated`);
    return responseHelper(res, 'success', 200, 'Data successfully updated', invoice);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};
