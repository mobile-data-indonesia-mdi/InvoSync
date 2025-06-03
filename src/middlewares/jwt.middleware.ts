import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@config/db';
import env from '@config/env';

export const authGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const accessToken = req.cookies['accessToken'];

  if (!accessToken) {
    res.status(401).json({ message: 'unauthorize' });
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
      res.status(401).json({ message: 'unauthorize' });
      return;
    }

    req.user = validate;
    next();
  } catch (err) {
    res.status(401).json({ message: err });
    return;
  }
};
