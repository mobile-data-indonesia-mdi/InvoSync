import { Router } from 'express';
import {
  createPaymentController,
  getAllPaymentController,
  getPaymentByIdController,
  getPaymentByClientController,
  editPaymentController,
  deletePaymentController,
  // restorePaymentController,
} from '@controllers/payment.controller';
import { upload_payment } from '@utils/MulterSetup';
const router = Router();

router.post('/', upload_payment.single('proof_of_transfer'), createPaymentController);
router.get('/', getAllPaymentController);
router.get('/:id', getPaymentByIdController);
router.get('/client/:clientId', getPaymentByClientController);
router.put('/:id', upload_payment.single('proof_of_transfer'), editPaymentController);
router.delete('/:id', deletePaymentController);
// router.patch('/:id/restore', restorePaymentController);

export default router;
