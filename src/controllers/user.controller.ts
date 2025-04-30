import type { Request, Response } from 'express';
import {
  registerService,
  loginService,
  refreshTokenService,
  getAllUserService,
  getUserByIdService,
  editUserByIdService,
} from '@services/user.service';
import { createLogService } from '@services/log.service';
import { userRequestSchema, userLoginSchema } from '@models/user.model';
import type { LogRequestSchema } from '@models/log.model';
import { parseZodError, ResponseHelper } from 'src/utils/ResponseHelper';
import ms from 'ms';
import env from '@config/env';

export const registerController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const validate = await userRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      logData = {...logData, status: 'ERROR', status_message: 'Invalid parameters'};
      await createLogService(logData);
            
      const parsed = parseZodError(validate.error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    await registerService(validate.data);

    logData = {...logData, status: 'SUCCESS', status_message: 'Data successfully created'};
    await createLogService(logData);
   
    ResponseHelper(res, 'success', 201, 'Data successfully created', null);
    return;
  } catch (error) {
    logData = {...logData, status: 'ERROR', status_message: 'Internal server error'};
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const validate = await userLoginSchema.safeParseAsync(req.body);

    if (!validate.success) {
      logData = {...logData, status: 'ERROR', status_message: 'Invalid parameters'};
      await createLogService(logData);
      
      const parsed = parseZodError(validate.error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    const { accessToken, refreshToken } = await loginService(validate.data);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: ms(env.JWT_SECRET_REFRESH_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    logData = {...logData, access_token: accessToken, status: 'SUCCESS', status_message: 'Succesful login'};
    await createLogService(logData);

    ResponseHelper(res, 'success', 200, 'Successfully Login', null);
    return;
  } catch (error) {
    logData = {...logData, status: 'ERROR', status_message: 'Internal server error'};
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const logoutController = async (_req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: _req.ip || 'unknown', access_token: _req.cookies['accessToken'], method: _req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: _req.originalUrl, payload: _req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    logData = {...logData, status: 'SUCCESS', status_message: 'Successfully logged out'};
    await createLogService(logData);
    
    ResponseHelper(res, 'success', 204, 'Successfully logged out', null);
    return;
  } catch (error) {
    logData = {...logData, status: 'ERROR', status_message: 'Internal server error'};
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    console.log('Masuk ke refresh token controller');
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      logData = {...logData, status: 'ERROR', status_message: 'Access denied. Please log in first'};
      await createLogService(logData);

      ResponseHelper(res, 'error', 401, 'Access denied. Please log in first', null);
      return;
    }

    const newAccessToken = await refreshTokenService(refreshToken);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'strict',
    });

    logData = {...logData, access_token: newAccessToken, status: 'SUCCESS', status_message: 'Data succesfully updated'};
    await createLogService(logData);
    
    ResponseHelper(res, 'success', 200, 'Data Successfully updated', null);
    return;
  } catch (error) {
    logData = {...logData, status: 'ERROR', status_message: 'Internal server error'};
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const getAllUserController = async (_req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: _req.ip || 'unknown', access_token: _req.cookies['accessToken'], method: _req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: _req.originalUrl, payload: _req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const users = await getAllUserService();

    if (users.length === 0) {
      logData = {...logData, status: 'SUCCESS', status_message: 'No content to display'};
      await createLogService(logData);

      ResponseHelper(res, 'success', 404, 'Data not found', null);
      return;
    }

    logData = {...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved'};
    await createLogService(logData);

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', users);
    return;
  } catch (error) {
    logData = {...logData, status: 'ERROR', status_message: 'Internal server error'};
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const userId = req.params.id;

    if (!userId) {
      logData = {...logData, status: 'ERROR', status_message: 'Invalid parameters'};
      await createLogService(logData);

      ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const user = await getUserByIdService(userId);

    if (!user) {
      logData = {...logData, status: 'ERROR', status_message: 'No content to display'};
      await createLogService(logData);

      ResponseHelper(res, 'error', 404, 'Data not found', null);
      return;
    }

    logData = {...logData, status: 'SUCCESS', status_message: 'Data successfully retrieved'};
    await createLogService(logData);

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', user);
    return;
  } catch (error) {
    logData = {...logData, status: 'ERROR', status_message: 'Internal server error'};
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

export const editUserByIdController = async (req: Request, res: Response): Promise<void> => {
  let logData: LogRequestSchema = {ip: req.ip || 'unknown', access_token: req.cookies['accessToken'], method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: req.originalUrl, payload: req.body, status: '' as 'SUCCESS' | 'ERROR', status_message: ''};
  try {
    const userId = req.params.id;

    if (!userId) {
      logData = {...logData, status: 'ERROR', status_message: 'Invalid parameters'};
      await createLogService(logData);

      ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const validate = await userRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      logData = {...logData, status: 'ERROR', status_message: 'Invalid parameters'};
      await createLogService(logData);
      
      const parsed = parseZodError(validate.error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    const updatedUser = await editUserByIdService(userId, validate.data);

    if (!updatedUser) {
      logData = {...logData, status: 'SUCCESS', status_message: 'No content to display'};
      await createLogService(logData);
            
      ResponseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    logData = {...logData, status: 'SUCCESS', status_message: 'Data successfully updated'};
    await createLogService(logData);

    ResponseHelper(res, 'success', 200, 'Data Successfully updated', updatedUser);
    return;
  } catch (error) {
    logData = {...logData, status: 'ERROR', status_message: 'Internal server error'};
    await createLogService(logData);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};
