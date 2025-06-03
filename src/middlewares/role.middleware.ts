import type { Request, Response, NextFunction } from 'express';

export const roleGuard = (
  allowedRoles: string[],
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ message: 'Forbidden, role not sufficient' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
