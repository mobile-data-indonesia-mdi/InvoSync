import type { Request, Response } from 'express';
import { registerService, loginService, refreshTokenService } from '@services/user.service';
import { userRequestSchema, userLoginSchema } from '@models/user.model';
import { parseZodError } from 'src/utils/ResponseHelper';
import ms from 'ms';
import env from '@config/env';

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    await registerService(validate.data);

    res.status(200).json({ message: 'User registered successfully' });
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userLoginSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    const { accessToken, refreshToken } = await loginService(validate.data);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'strict',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ms(env.JWT_SECRET_REFRESH_LIFETIME as ms.StringValue),
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'User login successfully' });
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({ message: 'User logout successfully' });
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
}

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token tidak ditemukan' });
      return;
    }

    const newAccessToken = await refreshTokenService(refreshToken);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Access token refreshed successfully' });
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
}