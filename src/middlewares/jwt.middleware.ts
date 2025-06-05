import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@config/db';
import env from '@config/env';
import { responseHelper } from '@utils/responseHelper';

export const authGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const accessToken = req.cookies['accessToken'];

  if (!accessToken) {
    responseHelper(res, 'error', 401, 'Unauthorized', null);
    return;
  }

  try {
    const decoded = jwt.verify(accessToken, env.JWT_SECRET_ACCESS) as {
      username: string;
      role: string;
    };

    const validate = await prisma.user.findUnique({
      select: {
        username: true,
        role: true,
      },
      where: {
        username: decoded.username,
        role: decoded.role,
      },
    });

    if (!validate) {
      responseHelper(res, 'error', 401, 'Unauthorized', null);
      return;
    }

    req.user = validate;
    next();
  } catch (err) {
    responseHelper(res, 'error', 401, 'Unauthorized', { error: err });
    return;
  }
};
