import { Router } from 'express';

import {
  createClientController,
  getAllClientController,
  getClientByIdController,
  editClientByIdController,
  deleteClientByIdController,
} from '@controllers/client.controller';

const router = Router();

router.get('/', getAllClientController);
router.get('/:id', getClientByIdController);
router.post('/', createClientController);
router.put('/:id', editClientByIdController);
router.delete('/:id', deleteClientByIdController);

export default router;
