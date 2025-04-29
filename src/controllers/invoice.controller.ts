import type { Request, Response } from 'express';
import {
  getAllInvoiceService,
  createInvoiceService,
  getInvoiceByIdService,
  updateInvoiceByIdService,
  deleteInvoiceByIdService,
} from '@services/invoice.service';
import { ZodError } from 'zod';
import { parseZodError, ResponseHelper } from '@utils/ResponseHelper';
import {
  invoiceWithDetailsRequestSchema,
  invoiceWithDetailsUpdateSchema,
} from '@models/invoice.model';

export const createInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await invoiceWithDetailsRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const invoice = await createInvoiceService(validate.data);
    ResponseHelper(res, 'success', 201, 'Data successfully created', invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
      return;
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
      return;
    }
  }
};

export const getAllInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await getAllInvoiceService();
    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', invoices);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', formattedError);
      return;
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
      return;
    }
  }
};

export const getInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice_id = req.params.id;

    if (!invoice_id) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const invoice = await getInvoiceByIdService(invoice_id);
    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', invoice);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    if (errorMessage === 'Invoice tidak ditemukan') {
      ResponseHelper(res, 'error', 404, 'Data not found', { error: errorMessage });
      return;
    }

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const updateInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice_id = req.params.id;

    if (!invoice_id) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }

    const validate = await invoiceWithDetailsUpdateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
    }

    const invoice = await updateInvoiceByIdService(invoice_id, validate.data);

    ResponseHelper(res, 'success', 200, 'Data Successfully updated', invoice);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const deleteInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice_id = req.params.id;

    if (!invoice_id) {
      ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
      return;
    }

    await deleteInvoiceByIdService(invoice_id);

    ResponseHelper(res, 'success', 204, 'Data successfully deleted', null);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};
