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

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register user baru
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 example: miti
 *                 maxLength: 50
 *               password:
 *                 type: string
 *                 example: password
 *                 minLength: 8
 *                 maxLength: 100
 *               role:
 *                 type: string
 *                 enum: [management, management]
 *                 example: management
 *     responses:
 *       201:
 *         description: User berhasil diregistrasi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Data successfully created
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: username
 *                       message:
 *                         type: string
 *                         example: Username wajib diisi
 *       409:
 *         description: User dengan username yang sama sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Data already exists
 *                 data:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: Error internal server
 */
export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userRegisterSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Invalid parameters');
      const parsedError = parseZodError(validate.error);
      responseHelper(res, 'error', 400, 'Invalid parameters', parsedError);
      return;
    }

    await registerService(validate.data);
    await log(req, 'SUCCESS', 'Data successfully created');
    responseHelper(res, 'success', 201, 'Data successfully created', null);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: miti
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       200:
 *         description: Login berhasil, token diberikan dalam cookie
 *         headers:
 *           Set-Cookie:
 *             description: Token akses dan refresh sebagai cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Successfully logged in
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Invalid parameters
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: username
 *                       message:
 *                         type: string
 *                         example: Username wajib diisi
 *       401:
 *         description: Username atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Username atau password salah
 *                 data:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: Error internal server
 */
export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userLoginSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Invalid parameters');
      const parsed = parseZodError(validate.error);
      responseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    const { accessToken, refreshToken } = await loginService(validate.data);
    const isProduction = process.env.NODE_ENV === 'production'; // Check if the environment is production

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: isProduction ? 'none' : 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      maxAge: ms(env.JWT_SECRET_REFRESH_LIFETIME as ms.StringValue),
      sameSite: isProduction ? 'none' : 'lax',
    });

    await log(req, 'SUCCESS', 'Successfully logged in');
    responseHelper(res, 'success', 200, 'Successfully logged in', null);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /users/logout:
 *   delete:
 *     summary: Logout user
 *     tags:
 *       - Users
 *     description: Menghapus cookie token akses dan refresh untuk logout.
 *     responses:
 *       204:
 *         description: Berhasil logout, cookie dihapus
 *         headers:
 *           Set-Cookie:
 *             description: Menghapus accessToken dan refreshToken
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Successfully logged out
 *                 data:
 *                   type: object
 *                   nullable: true
 */
export const logoutController = async (req: Request, res: Response): Promise<void> => {
  await log(req, 'SUCCESS', 'Successfully logged out');
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

/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Users
 *     description: Menghasilkan access token baru menggunakan refresh token yang ada di cookie.
 *     responses:
 *       200:
 *         description: Access token berhasil diperbarui
 *         headers:
 *           Set-Cookie:
 *             description: Access token baru dikirim sebagai cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Access token successfully refreshed
 *                 data:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: Tidak ada refresh token atau token tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Access denied. Please log in first
 *                 data:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: Error internal server
 */
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

    await log(req, 'SUCCESS', 'Access token successfully refreshed');
    responseHelper(res, 'success', 200, 'Access token successfully refreshed', null);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Ambil profil user yang sedang login
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     description: Mengambil informasi user dari token yang sudah diverifikasi (melalui middleware authGuard).
 *     responses:
 *       200:
 *         description: Autentikasi berhasil dan profil berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Authentication successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: miti
 *                     role:
 *                       type: string
 *                       example: management
 *       401:
 *         description: Unauthorized - user tidak login atau token tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Access denied. Please log in first
 *                 data:
 *                   type: object
 *                   nullable: true
 */
export const profileController = async (req: Request, res: Response): Promise<void> => {
  await log(req, 'SUCCESS', 'Profile retrieved successfully');
  responseHelper(res, 'success', 200, ' Authentication successful', req.user);
};

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Ambil semua data user
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     description: Mengambil seluruh data user yang belum dihapus. Hanya dapat diakses oleh role management.
 *     responses:
 *       200:
 *         description: Berhasil mengambil semua data user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data successfully retrieved
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         example: "0a9e4a22-8f1c-4c2a-9a3a-2c3a5d1c1234"
 *                       username:
 *                         type: string
 *                         example: miti
 *                       role:
 *                         type: string
 *                         example: management
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-04-29T12:34:56.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-04-30T08:20:00.000Z"
 *       401:
 *         description: Tidak diotorisasi (tidak login atau token tidak valid)
 *       403:
 *         description: Tidak memiliki akses (bukan role management)
 *       500:
 *         description: Error internal server
 */
export const getAllUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUserService();

    await log(req, 'SUCCESS', 'Users retrieved successfully');
    responseHelper(res, 'success', 200, 'Data successfully retrieved', users);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Ambil detail user berdasarkan ID
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     description: Mengambil data user berdasarkan user_id. Hanya bisa diakses oleh role `management`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID dari user yang ingin diambil datanya
 *     responses:
 *       200:
 *         description: Data user berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data successfully retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "0a9e4a22-8f1c-4c2a-9a3a-2c3a5d1c1234"
 *                     username:
 *                       type: string
 *                       example: miti
 *                     role:
 *                       type: string
 *                       example: management
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-04-29T12:34:56.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-04-30T08:20:00.000Z"
 *       400:
 *         description: Parameter ID tidak valid
 *       401:
 *         description: Tidak diotorisasi
 *       403:
 *         description: Tidak memiliki akses (bukan role management)
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Error internal server
 */
export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      await log(req, 'ERROR', 'Invalid user ID');
      responseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const user = await getUserByIdService(userId);

    if (!user) {
      await log(req, 'ERROR', 'User not found');
      responseHelper(res, 'error', 404, 'Data not found', null);
      return;
    }

    await log(req, 'SUCCESS', 'User retrieved successfully');
    responseHelper(res, 'success', 200, 'Data successfully retrieved', user);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update data user berdasarkan ID
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     description: Mengupdate data user berdasarkan user_id. Hanya dapat diakses oleh role `management`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID dari user yang ingin diupdate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: tio
 *               role:
 *                 type: string
 *                 enum:
 *                   - management
 *                   - management
 *                 example: management
 *     responses:
 *       200:
 *         description: Data user berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data successfully updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "291d5bf1-e0d1-41f9-8229-e7de89a6f3dd"
 *                     username:
 *                       type: string
 *                       example: tio
 *                     role:
 *                       type: string
 *                       example: management
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-30T04:57:40.706Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-30T10:12:35.289Z"
 *       400:
 *         description: Parameter ID tidak valid atau data tidak valid
 *       401:
 *         description: Tidak diotorisasi
 *       403:
 *         description: Tidak memiliki akses (bukan role management)
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Error internal server
 */
export const editUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      await log(req, 'ERROR', 'Invalid user ID');
      responseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const validate = await userUpdateSchema.safeParseAsync(req.body);

    if (!validate.success) {
      await log(req, 'ERROR', 'Invalid parameters');
      const parsedError = parseZodError(validate.error);
      responseHelper(res, 'error', 400, 'Invalid parameters', parsedError);
      return;
    }

    const updatedUser = await editUserByIdService(userId, validate.data);

    if (!updatedUser) {
      await log(req, 'ERROR', 'No content to display');
      responseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    await log(req, 'SUCCESS', 'User updated successfully');
    responseHelper(res, 'success', 200, 'Data successfully updated', updatedUser);
  } catch (error) {
    const errorMessage = error instanceof HttpError ? error.message : 'Internal server error';
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    await log(req, 'ERROR', errorMessage);
    responseHelper(res, 'error', statusCode, errorMessage, null);
    return;
  }
};
