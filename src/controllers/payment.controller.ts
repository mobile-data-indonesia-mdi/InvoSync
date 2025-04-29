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
import { parseZodError, ResponseHelper } from '@utils/ResponseHelper';
import { ZodError } from 'zod';
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
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', parsed);
    }

    const payment = await createPaymentService(validate.data, req.file!);

    return ResponseHelper(res, 'success', 201,  'Data successfully created', payment);
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

export const getAllPaymentController = async (req: Request, res: Response) => {
  try {
    const payments = await getAllPaymentService();
    return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', payments);
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

export const getPaymentByClientController = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Client ID is required',
      });
    }

    const payment = await getPaymentByClientService(clientId);
    return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', payment);
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

export const getPaymentByIdController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    const payment = await getPaymentByIdService(payment_id);
    return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', payment);
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

export const editPaymentController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;
    if (!payment_id) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    // Parse from multipart/form-data
    if (req.body.amount_paid && typeof req.body.amount_paid !== 'number') {
      req.body.amount_paid = parseFloat(req.body.amount_paid);
    } 

    const validate = await paymentUpdateRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', parsed);
    }

    const payment = await editPaymentService(payment_id, validate.data, req.file);
    return ResponseHelper(res, 'success', 201,  'Data Successfully updated', payment);
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

export const deletePaymentController = async (req: Request, res: Response) => {
  try {
    const payment_id = req.params.id;

    if (!payment_id) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment ID is required',
      });
    }

    await deletePaymentByIdService(payment_id);
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

export const getProofPaymentController = async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
        message: 'Payment Filename is required',
      });
    }

    const filePath = await getProofPaymentService(filename);
    const safePath = path.resolve(filePath);
    const baseDir = path.resolve('uploads', 'payments');

     // Validasi agar file berada dalam folder yang benar (mencegah directory traversal)
    if (!safePath.startsWith(baseDir)) {
      return ResponseHelper(res, 'error', 403, 'You do not have permission to access this resource', null);
    }
    
    // Periksa apakah file ada
    if (!fs.existsSync(safePath)) {
      return ResponseHelper(res, 'error', 404, 'Data not found', { message: 'File not found' });
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        return ResponseHelper(res, 'error', 500, 'Internal server error', { error: 'Error sending file' });
      }
    });
  }
  catch (error) {
    if (error instanceof ZodError) {
      const formattedError = parseZodError(error);
      return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
    }
  }
}


// export const restorePaymentController = async (req: Request, res: Response) => {
//   try {
//     const payment_id = req.params.id;

//     if (!payment_id) {
//       res.status(400).json({ message: 'Payment ID is required' });
//       return ResponseHelper(res, 'error', 400, 'Invalid parameters', {
//         message: 'Payment ID is required'
//       });
//     }

//     const voidPayment = await restorePaymentService(payment_id);
//     return ResponseHelper(res, 'success', 200,  'Data successfully retrieved', voidPayment);
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const formattedError = parseZodError(error);
//       return ResponseHelper(res, 'error', 400,  'Invalid parameters', formattedError);
//     } else {
//       const errorMessage = error instanceof Error ? error.message : 'Internal server error';
//       return ResponseHelper(res, 'error', 500,  'Internal server error', { error: errorMessage });
//     }
//   }
// };
