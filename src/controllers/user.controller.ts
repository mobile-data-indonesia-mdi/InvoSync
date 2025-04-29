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
import { parseZodError, ResponseHelper } from 'src/utils/ResponseHelper';
import ms from 'ms';
import env from '@config/env';

/**
 * @openapi
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: budikuningan
 *               password:
 *                 type: string
 *                 example: password
 *               role:
 *                 type: string
 *                 example: finance
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Internal server error
 */
export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    await registerService(validate.data);

    ResponseHelper(res, 'success', 201, 'Data successfully created', null);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /user/login:
 *   post:
 *     summary: Login an existing user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: budikuningan
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       200:
 *         description: Successfully logged in, cookies set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully Login
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid parameters
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validate = await userLoginSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    const { accessToken, refreshToken } = await loginService(validate.data);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      // secure: env.NODE_ENV === 'production',
      secure: true,
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      // secure: env.NODE_ENV === 'production',
      secure: true,
      maxAge: ms(env.JWT_SECRET_REFRESH_LIFETIME as ms.StringValue),
      sameSite: 'none',
    });

    ResponseHelper(res, 'success', 200, 'Successfully Login', null);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /user/logout:
 *   delete:
 *     summary: Logout the current user and clear cookies
 *     tags:
 *       - Auth
 *     responses:
 *       204:
 *         description: Successfully logged out, cookies cleared
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const logoutController = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      // secure: env.NODE_ENV === 'production',
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      // secure: env.NODE_ENV === 'production',
      secure: true,
      sameSite: 'none',
    });

    ResponseHelper(res, 'success', 204, 'Successfully logged out', null);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /user/refresh-token:
 *   post:
 *     summary: Refresh the access token using the refresh token
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Successfully refreshed the access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data Successfully updated
 *       401:
 *         description: Access denied due to missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Access denied. Please log in first
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const refreshTokenController = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Masuk ke refresh token controller');
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      ResponseHelper(res, 'error', 401, 'Access denied. Please log in first', null);
      return;
    }

    const newAccessToken = await refreshTokenService(refreshToken);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      secure: true,
      maxAge: ms(env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue),
      sameSite: 'strict',
    });

    ResponseHelper(res, 'success', 200, 'Data Successfully updated', null);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /user/profile:
 *   get:
 *     summary: Get the authenticated user's profile information (username and role)
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Successfully retrieved the user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Autentikasi berhasil
 *                 data:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: budikuningan
 *                     role:
 *                       type: string
 *                       example: finance
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const profileController = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    ResponseHelper(res, 'error', 401, 'Internal server error', null);
    return;
  }

  const user = req.user;

  res.status(200).json({
    message: 'Autentikasi berhasil',
    data: user,
  });
  return;
};

export const getAllUserController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUserService();

    if (users.length === 0) {
      ResponseHelper(res, 'success', 404, 'Data not found', null);
      return;
    }

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', users);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /user/{id}:
 *   get:
 *     summary: Retrieve user by ID
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to retrieve
 *         schema:
 *           type: string
 *           example: '123456'
 *     responses:
 *       200:
 *         description: Data successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: '123456'
 *                 username:
 *                   type: string
 *                   example: 'budikuningan'
 *                 role:
 *                   type: string
 *                   example: 'finance'
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: Data not found
 *       500:
 *         description: Internal server error
 */
export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const user = await getUserByIdService(userId);

    if (!user) {
      ResponseHelper(res, 'error', 404, 'Data not found', null);
      return;
    }

    ResponseHelper(res, 'success', 200, 'Data successfully retrieved', user);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};

/**
 * @openapi
 * /user/{id}:
 *   put:
 *     summary: Update user details by ID
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to update
 *         schema:
 *           type: string
 *           example: '123456'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: 'budikuningan'
 *               password:
 *                 type: string
 *                 example: 'newpassword'
 *               role:
 *                 type: string
 *                 example: 'admin'
 *     responses:
 *       200:
 *         description: Data successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: '123456'
 *                 username:
 *                   type: string
 *                   example: 'budikuningan'
 *                 role:
 *                   type: string
 *                   example: 'admin'
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: User not found or no content to display
 *       500:
 *         description: Internal server error
 */
export const editUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      ResponseHelper(res, 'error', 400, 'Invalid parameters', null);
      return;
    }

    const validate = await userRequestSchema.safeParseAsync(req.body);

    if (!validate.success) {
      const parsed = parseZodError(validate.error);
      ResponseHelper(res, 'error', 400, 'Invalid parameters', parsed);
      return;
    }

    const updatedUser = await editUserByIdService(userId, validate.data);

    if (!updatedUser) {
      ResponseHelper(res, 'success', 404, 'No content to display', null);
      return;
    }

    ResponseHelper(res, 'success', 200, 'Data Successfully updated', updatedUser);
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    ResponseHelper(res, 'error', 500, 'Internal server error', { error: errorMessage });
    return;
  }
};
