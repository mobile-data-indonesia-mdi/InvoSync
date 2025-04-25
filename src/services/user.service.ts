import { prisma } from '@config/db';
import bcrypt from 'bcryptjs';
import { type UserRequest, type UserLogin, userPublicSchema } from '@models/user.model';
import jwt from 'jsonwebtoken';
import env from '@config/env';
import ms from 'ms';

export const registerService = async (userData: UserRequest) => {
  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        username: userData.username,
      },
    });

    // If the user already exists, return null or throw an error
    if (existingUser) {
      throw new Error('User sudah terdaftar');
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
      },
    });
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';

    throw new Error(errorMessage);
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
      throw new Error('User tidak terdaftar');
    }

    const isPasswordValid = await bcrypt.compare(userData.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Password salah');
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
    console.error('Error login:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const refreshTokenService = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET_REFRESH) as {
      username: string;
      role: string;
    };

    if (!decoded) {
      throw new Error('Refresh token tidak valid');
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
    console.error('Error refreshing token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Problem';
    throw new Error(errorMessage);
  }
};

export const getAllUserService = async () => {
  try {
    const users = await prisma.user.findMany();

    //parse jadi public schema
    const parsedUsers = users.map(u => userPublicSchema.parse(u));
    return parsedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const getUserByIdService = async (user_id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        user_id,
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    //parse jadi public chema
    const parsedUser = userPublicSchema.parse(user);

    return parsedUser;
  } catch (error) {
    console.error('Error fetching user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const updateUserByIdService = async (user_id: string, userData: UserRequest) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        user_id,
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const updatedUser = await prisma.user.update({
      where: {
        user_id,
      },
      data: {
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};
