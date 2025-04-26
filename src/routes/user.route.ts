import { Router } from 'express';

import {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  getAllUserController,
  getUserByIdController,
  editUserByIdController,
} from '@controllers/user.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token', refreshTokenController);
router.delete('/logout', logoutController);
router.get('/', getAllUserController);
router.get('/:id', getUserByIdController);
router.put('/:id', editUserByIdController);

export default router;
