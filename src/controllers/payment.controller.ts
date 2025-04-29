import type { Request, Response } from 'express';
import { paymentRequestSchema, paymentUpdateRequestSchema } from '@models/payment.model';
import {
  createPaymentService,
  getAllPaymentService,
  getPaymentByClientService,
  getPaymentByIdService,
  editPaymentService,
  deletePaymentByIdService,
  getProofPaymentService
  // restorePaymentService,
} from '@services/payment.service';
import { parseZodError } from '@utils/ResponseHelper';
import path from 'path';
import fs from 'fs';

interface CustomRequest extends Request {
  file?: Express.Multer.File;
}

export const createPaymentController = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    // Parse from multipart/form-data
    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    } 

    if (!req.body.proof_of_transfer && req.file) {
      req.body.proof_of_transfer = req.file.path;
    }

    const validate = await paymentRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    const payment = await createPaymentService(validate.data, req.file!);

    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};

export const getAllPaymentController = async (req: Request, res: Response) => {
  try {
    const payment = await getAllPaymentService();
    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};

export const editPaymentController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;
    if (!payment_id) {
      res.status(400).json({ message: 'Payment ID is required' });
      return;
    }

    // Parse from multipart/form-data
    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    } 

    const validate = await paymentUpdateRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    const payment = await editPaymentService(payment_id, validate.data, req.file);
    res.status(201).json({ message: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
};

export const deletePaymentController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      res.status(400).json({ message: 'Payment ID is required' });
      return;
    }

    await deletePaymentByIdService(payment_id);
    res.status(201).json({ message: "Payment berhasil dihapus" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
};

export const getProofPaymentController = async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      res.status(400).json({ message: 'Payment  is required' });
      return;
    }

    const filePath = await getProofPaymentService(filename);
    const safePath = path.resolve(filePath);
    const baseDir = path.resolve('uploads', 'payments');

     // Validasi agar file berada dalam folder yang benar (mencegah directory traversal)
    if (!safePath.startsWith(baseDir)) {
      res.status(403).json({ message: 'Access forbidden' });
    }
    
    // Periksa apakah file ada
    if (!fs.existsSync(safePath)) {
      res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ message: 'Error sending file' });
      }
    });
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    res.status(500).json({ error: errorMessage });
  }
}


// export const restorePaymentController = async (req: Request, res: Response) => {
//   try {
//     const payment_id = req.params.id;

//     if (!payment_id) {
//       res.status(400).json({ message: 'Payment ID is required' });
//       return;
//     }

//     const voidPayment = await restorePaymentService(payment_id);
//     res.status(200).json({ message: 'Payment berhasil direstore' });
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'Internal server error';
//     res.status(500).json({ error: errorMessage });
//   }
// };
