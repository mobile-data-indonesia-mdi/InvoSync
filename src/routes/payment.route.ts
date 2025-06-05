import { Router } from 'express';
import {
  createPaymentController,
  getAllPaymentController,
  getPaymentByIdController,
  editPaymentController,
  getProofPaymentController,
  togglePaymentVoidStatusController,
} from '@controllers/payment.controller';
import { upload_payment } from '@utils/multerSetup';
import { authGuard } from '@middlewares/jwt.middleware';
import { roleGuard } from '@middlewares/role.middleware';

const router = Router();

router.get('/', authGuard, roleGuard(['finance', 'management']), getAllPaymentController);
router.get('/:id', authGuard, roleGuard(['finance', 'management']), getPaymentByIdController);

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
router.patch(
  '/:id/void-status',
  authGuard,
  roleGuard(['finance', 'management']),
  togglePaymentVoidStatusController,
);
//router.delete('/:id', authGuard, roleGuard(['finance']), deletePaymentController);

export default router;
