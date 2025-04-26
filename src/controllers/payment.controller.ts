import type { Request, Response } from 'express';
import { paymentRequestSchema } from '@models/payment.model';
import {
  createPaymentService,
  getAllPaymentService,
  getPaymentByClientService,
  getPaymentByIdService,
  updatePaymentService,
  softDeletePaymentService,
  restorePaymentService,
} from '@services/payment.service';
import { parseZodError } from '@utils/ResponseHelper';

export const createPaymentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await paymentRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    const payment = await createPaymentService(validate.data);
    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};

export const getAllPaymentController = async (req: Request, res: Response) => {
  try {
    const payment = await getAllPaymentService();
    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};

export const getPaymentByClientController = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      res.status(400).json({ message: 'Client ID is required' });
      return;
    }

    const payment = await getPaymentByClientService(clientId);
    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};

export const getPaymentByIdController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      res.status(400).json({ message: 'Payment ID is required' });
      return;
    }

    const payment = await getPaymentByIdService(payment_id);
    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};

export const updatePaymentController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      res.status(400).json({ message: 'Payment ID is required' });
      return;
    }

    const validate = await paymentRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    const payment = await updatePaymentService(payment_id, validate.data);
    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};

// Soft Delete and Restore Payment
export const softDeletePaymentController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      res.status(400).json({ message: 'Payment ID is required' });
      return;
    }

    const voidPayment = await softDeletePaymentService(payment_id);
    res.status(200).json({ message: 'Payment berhasil dirubah menjadi void' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};

export const restorePaymentController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      res.status(400).json({ message: 'Payment ID is required' });
      return;
    }

    const voidPayment = await restorePaymentService(payment_id);
    res.status(200).json({ message: 'Payment berhasil direstore' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};
