import type { Request, Response } from 'express';
import ms from 'ms';

import env from '@config/env';
import { userRegisterSchema, userLoginSchema, userUpdateSchema } from '@models/user.model';
import {
  registerService,
  loginService,
  refreshTokenService,
  getAllUserService,
  getUserByIdService,
  editUserByIdService,
} from '@services/user.service';
import log from '@utils/logs';
import responseHelper from '@utils/responseHelper';
import parseZodError from '@utils/parseZodError';
import HttpError from '@utils/httpError';

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userRegisterSchema.safeParseAsync(req.body);

    if (!validate.success) {
      log(req, 'ERROR', 'Invalid parameters');
      const parsedError = parseZodError(validate.error);
      responseHelper(res, 'error', 400, 'Invalid parameters', parsedError);
      return;
    }

    await registerService(validate.data);
    log(req, 'SUCCESS', 'Data successfully created');
    responseHelper(res, 'success', 201, 'Data successfully created', null);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userLoginSchema.safeParseAsync(req.body);

    if (!validate.success) {
      log(req, 'ERROR', 'Invalid parameters');
      const parsed = parseZodError(validate.error);
      responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    const { accessToken, refreshToken } = await loginService(validate.data);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: ms(env.JWT_SECRET_REFRESH_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    log(req, 'SUCCESS', 'Successfully logged in');
    responseHelper(res, 'success', 200, 'Successfully logged in', null);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const logoutController = (req: Request, res: Response): void => {
  log(req, 'SUCCESS', 'Successfully logged out');
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  responseHelper(res, 'success', 204, 'Successfully logged out', null);
};

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      log(req, 'ERROR', 'Access denied. No refresh token provided');
      responseHelper(res, 'error', 401, 'Access denied. Please log in first', null);
      return;
    }

    const newAccessToken = await refreshTokenService(refreshToken);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'strict',
    });

    log(req, 'SUCCESS', 'Access token successfully refreshed');
    responseHelper(res, 'success', 200, 'Access token successfully refreshed', null);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const profileController = async (req: Request, res: Response): Promise<void> => {
  log(req, 'SUCCESS', 'Profile retrieved successfully');
  responseHelper(res, 'success', 200, ' Authentication successful', req.user);
};

export const getAllUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUserService();

    if (users.length === 0) {
      log(req, 'ERROR', 'No users found');
      responseHelper(res, 'success', 404, 'Data not found', null);
      return;
    }

    log(req, 'SUCCESS', 'Users retrieved successfully');
    responseHelper(res, 'success', 200, 'Data successfully retrieved', users);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      log(req, 'ERROR', 'Invalid user ID');
      responseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const user = await getUserByIdService(userId);

    if (!user) {
      log(req, 'ERROR', 'User not found');
      responseHelper(res, 'error', 404, 'Data not found', null);
      return;
    }

    log(req, 'SUCCESS', 'User retrieved successfully');
    responseHelper(res, 'success', 200, 'Data successfully retrieved', user);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

export const editUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      log(req, 'ERROR', 'Invalid user ID');
      responseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const validate = await userUpdateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      log(req, 'ERROR', 'Invalid parameters');
      const parsedError = parseZodError(validate.error);
      responseHelper(res, 'error', 400, 'Invalid parameters', parsedError);
      return;
    }

    const updatedUser = await editUserByIdService(userId, validate.data);

    if (!updatedUser) {
      log(req, 'ERROR', 'No content to display');
      responseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    log(req, 'SUCCESS', 'User updated successfully');
    responseHelper(res, 'success', 200, 'Data successfully updated', updatedUser);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};
