import type { Request, Response } from 'express';
import {
  getAllInvoiceService,
  createInvoiceService,
  getInvoiceByIdService,
  updateInvoiceByIdService,
  deleteInvoiceByIdService,
} from '@services/invoice.service';
import { parseZodError } from '@utils/ResponseHelper';
import {
  invoiceWithDetailsRequestSchema,
  invoiceWithDetailsUpdateSchema,
} from '@models/invoice.model';

export const getAllInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await getAllInvoiceService();
    res.status(200).json(invoices);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};

export const createInvoiceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await invoiceWithDetailsRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    const invoice = await createInvoiceService(validate.data);
    res.status(201).json({ message: invoice });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};

export const getInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice_id = req.params.id;
    if (!invoice_id) {
      res.status(400).json({ message: 'Invoice ID is required' });
      return;
    }

    const invoice = await getInvoiceByIdService(invoice_id);
    res.status(200).json(invoice);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};

export const updateInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice_id = req.params.id;

    if (!invoice_id) {
      res.status(400).json({ message: 'Invoice ID is required' });
      return;
    }

    const validate = await invoiceWithDetailsUpdateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    const invoice = await updateInvoiceByIdService(invoice_id, validate.data);
    res.status(200).json(invoice);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};

export const deleteInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice_id = req.params.id;
    if (!invoice_id) {
      res.status(400).json({ message: 'Invoice ID is required' });
      return;
    }
    await deleteInvoiceByIdService(invoice_id);
    res.status(204).send();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};
