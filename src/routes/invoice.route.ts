import { Router } from 'express';

import {
  createInvoiceController,
  getAllInvoiceController,
  getInvoiceByIdController,
  //   updateInvoiceByIdController,
  //   deleteInvoiceByIdController,
} from '@controllers/invoice.controller';

const router = Router();

router.get('/', getAllInvoiceController);
router.get('/:id', getInvoiceByIdController);
router.post('/', createInvoiceController);
// router.put('/:id', updateInvoiceByIdController);
// router.delete('/:id', deleteInvoiceByIdController);

export default router;
