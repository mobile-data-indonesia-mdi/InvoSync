import type { Request, Response } from 'express';
import {
  registerService,
  loginService,
  refreshTokenService,
  getAllUserService,
  getUserByIdService,
  editUserByIdService,
} from '@services/user.service';
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
      httpOnly: false,
      secure: false,
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: ms(env.JWT_SECRET_REFRESH_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    res.status(200).json({ message: 'User login successfully' });
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

export const logoutController = async (_req: Request, res: Response): Promise<void> => {
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
};

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('masuk ke refresh token controller', req.cookies);
    const refreshToken = req.cookies['refreshToken'];

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
};

//get all user
export const getAllUserController = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Call the service to get all users
    const users = await getAllUserService();
    if (!users) {
      res.status(404).json({ message: 'No users found' });
      return;
    }

    res.status(200).json(users);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

//get user by id
export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    // Call the service to get user by ID
    const user = await getUserByIdService(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};

//update user by id (PUT)

export const editUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const validate = await userRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      res.status(400).json(parsed);
      return;
    }

    // Call the service to update user by ID
    const updatedUser = await editUserByIdService(userId, validate.data);
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(updatedUser);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    res.status(500).json({ error: errorMessage });
    return;
  }
};
