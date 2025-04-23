import { Router } from 'express';

import {
  registerController,
  loginController,
  refreshTokenController,
} from '@controllers/user.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token', refreshTokenController);

export default router;
