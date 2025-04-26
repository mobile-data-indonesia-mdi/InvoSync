import { Router } from 'express';
import {
  createPaymentController,
  getAllPaymentController,
  getPaymentByIdController,
  getPaymentByClientController,
  updatePaymentController,
  restorePaymentController,
} from '@controllers/payment.controller';
const router = Router();

router.post('/', createPaymentController);
router.get('/', getAllPaymentController);
router.get('/:id', getPaymentByIdController);
router.get('/client/:clientId', getPaymentByClientController);
router.put('/:id', updatePaymentController);
router.patch('/:id/restore', restorePaymentController);

export default router;
