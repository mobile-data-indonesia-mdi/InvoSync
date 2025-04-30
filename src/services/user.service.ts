import bcrypt from 'bcryptjs';
import ms from 'ms';
import jwt from 'jsonwebtoken';

import { prisma } from '@config/db';
import env from '@config/env';
import {
  type UserRegister,
  type UserLogin,
  type UserUpdate,
  userPublicSchema,
} from '@models/user.model';
import HttpError from '@utils/httpError';

export const registerService = async (userData: UserRegister) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        username: userData.username,
      },
    });

    if (existingUser) {
      throw new HttpError('Data already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
      },
    });

    return newUser;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const loginService = async (userData: UserLogin) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: userData.username,
      },
    });

    if (!user) {
      throw new HttpError('Username atau password salah', 401);
    }

    const isPasswordValid = await bcrypt.compare(userData.password, user.password);

    if (!isPasswordValid) {
      throw new HttpError('Username atau password salah', 401);
    }

    const accessToken = jwt.sign(
      { username: user.username, role: user.role },
      env.JWT_SECRET_ACCESS,
      {
        expiresIn: env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue,
      },
    );

    const refreshToken = jwt.sign(
      { username: user.username, role: user.role },
      env.JWT_SECRET_REFRESH,
      {
        expiresIn: env.JWT_SECRET_REFRESH_LIFETIME as ms.StringValue,
      },
    );

    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const refreshTokenService = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET_REFRESH) as {
      username: string;
      role: string;
    };

    if (!decoded) {
      throw new HttpError('Access denied. Please log in first', 401);
    }

    const accessToken = jwt.sign(
      { username: decoded.username, role: decoded.role },
      env.JWT_SECRET_ACCESS,
      {
        expiresIn: env.JWT_SECRET_ACCESS_LIFETIME as ms.StringValue,
      },
    );

    return accessToken;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new HttpError('Access denied. Please log in first', 401);
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getAllUserService = async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
      },
    });

    if (!users) {
      throw new HttpError('User tidak ditemukan', 404);
    }

    const parsedUsers = users.map(user => userPublicSchema.parse(user));

    return parsedUsers;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getUserByIdService = async (user_id: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        AND: [{ user_id }, { deleted_at: null }],
      },
    });

    if (!user) {
      throw new HttpError('User tidak ditemukan', 404);
    }

    const parsedUser = userPublicSchema.parse(user);

    return parsedUser;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const editUserByIdService = async (user_id: string, userData: UserUpdate) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        AND: [{ user_id }, { deleted_at: null }],
      },
    });

    if (!user) {
      throw new HttpError('User tidak ditemukan', 404);
    }

    const updatedUser = await prisma.user.update({
      where: {
        user_id,
      },
      data: {
        username: userData.username,
        role: userData.role,
      },
    });

    // Parse updated user data into a public schema
    const parsedUser = userPublicSchema.parse(updatedUser);

    return parsedUser;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

// export const softDeleteUserByIdService = async (user_id: string) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: {
//         user_id,
//       },
//     });

//     if (!user) {
//       throw new Error('User tidak ditemukan');
//     }

//     await prisma.user.update({
//       where: {
//         user_id,
//       },
//       data: {
//         deleted_at: new Date(),
//       },
//     });

//     return { message: 'User berhasil di-soft delete' };
//   } catch (error) {
//     if (error instanceof HttpError) {
//       throw error;
//     }

//     throw new HttpError('Internal Server Error', 500);
//   }
// };
