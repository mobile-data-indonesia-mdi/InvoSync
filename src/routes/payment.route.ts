import { Router } from 'express';
import {
  createPaymentController,
  getAllPaymentController,
  getPaymentByIdController,
  getPaymentByClientController,
  editPaymentController,
  deletePaymentController,
  getProofPaymentController,
  // restorePaymentController,
} from '@controllers/payment.controller';
import { upload_payment } from '@utils/MulterSetup';
import { authGuard } from '@middlewares/jwt.middleware';
import { roleGuard } from '@middlewares/role.middleware';

const router = Router();

router.get('/', authGuard, roleGuard(['finance', 'management']), getAllPaymentController);
router.get('/:id', authGuard, roleGuard(['finance', 'management']), getPaymentByIdController);
router.get(
  '/client/:clientId',
  authGuard,
  roleGuard(['finance', 'management']),
  getPaymentByClientController,
);
router.get(
  '/upload/:filename',
  authGuard,
  roleGuard(['finance', 'management']),
  getProofPaymentController,
);

router.post(
  '/',
  authGuard,
  roleGuard(['finance']),
  upload_payment.single('proof_of_transfer'),
  createPaymentController,
);
router.put(
  '/:id',
  authGuard,
  roleGuard(['finance']),
  upload_payment.single('proof_of_transfer'),
  editPaymentController,
);
router.delete('/:id', authGuard, roleGuard(['finance']), deletePaymentController);
// router.patch('/:id/restore', restorePaymentController);

export default router;
