import { Router } from 'express';

import {
  createClientController,
  getAllClientController,
  getClientByIdController,
  updateClientByIdController,
  deleteClientByIdController,
} from '@controllers/client.controller';

const router = Router();

router.get('/', getAllClientController);
router.get('/:id', getClientByIdController);
router.post('/', createClientController);
router.put('/:id', updateClientByIdController);
router.delete('/:id', deleteClientByIdController);

export default router;
