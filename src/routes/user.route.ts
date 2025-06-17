import { Router } from 'express';

import {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  profileController,
  getAllUserController,
  getUserByIdController,
  editUserByIdController,
} from '@controllers/user.controller';
import { authGuard } from '@middlewares/jwt.middleware';
import { roleGuard } from '@middlewares/role.middleware';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token', refreshTokenController);
router.delete('/logout', logoutController);

//authenticated routes
router.get('/profile', authGuard, profileController);
// router.post('/register', authGuard, roleGuard(['management']), registerController); //ini buat nanti
router.get('/', authGuard, roleGuard(['management']), getAllUserController);
router.get('/:id', authGuard, roleGuard(['management']), getUserByIdController);
router.put('/:id', authGuard, editUserByIdController);

export default router;
