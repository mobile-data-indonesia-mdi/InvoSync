import { Router } from 'express';

import {
  createInvoiceController,
  getAllInvoiceController,
  getInvoiceByIdController,
  updateInvoiceByIdController,
  deleteInvoiceByIdController,
} from '@controllers/invoice.controller';

import { authGuard } from '@middlewares/jwt.middleware';
import { roleGuard } from '@middlewares/role.middleware';

const router = Router();

router.get('/', authGuard, roleGuard(['finance', 'management']), getAllInvoiceController);
router.get('/:id', authGuard, roleGuard(['finance', 'management']), getInvoiceByIdController);
router.get(
  '/receivables',
  authGuard,
  roleGuard(['finance', 'management']),
  getAllInvoiceController,
);
router.post('/', authGuard, roleGuard(['finance']), createInvoiceController);
router.put('/:id', authGuard, roleGuard(['finance']), updateInvoiceByIdController);
router.delete('/:id', authGuard, roleGuard(['finance']), deleteInvoiceByIdController);

export default router;
