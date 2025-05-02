import { Router } from 'express';

import {
  createClientController,
  getAllClientController,
  getClientByIdController,
  editClientByIdController,
  // deleteClientByIdController,
} from '@controllers/client.controller';

import { authGuard } from '@middlewares/jwt.middleware';
import { roleGuard } from '@middlewares/role.middleware';

const router = Router();

router.post('/', authGuard, roleGuard(['finance']), createClientController);
router.get('/', authGuard, roleGuard(['finance', 'management']), getAllClientController);
router.get('/:id', authGuard, roleGuard(['finance', 'management']), getClientByIdController);
router.put('/:id', authGuard, roleGuard(['finance']), editClientByIdController);
// router.delete('/:id', authGuard, roleGuard(['finance']), deleteClientByIdController);

export default router;
