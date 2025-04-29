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
import { ZodError } from 'zod';

export const getAllInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await getAllInvoiceService();
    return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', invoices);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};

export const createInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await invoiceWithDetailsRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', parsed);
    }

    const invoice = await createInvoiceService(validate.data);
    return ResponseHelper(res, 'success', 201,  'Data successfully created', invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
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
    return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
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
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', parsed);
    }

    const invoice = await updateInvoiceByIdService(invoice_id, validate.data);
    return ResponseHelper(res, 'success', 200,  'Data Successfully updated', invoice);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};

export const deleteInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice_id = req.params.id;
    if (!invoice_id) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Invoice ID is required',
      });
    }
    await deleteInvoiceByIdService(invoice_id);
    res.status(204).send();
    return ResponseHelper(res, 'success', 204,  'Data successfully deleted', null);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
};
