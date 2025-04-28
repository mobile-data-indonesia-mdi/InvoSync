import { prisma } from '@config/db';
import bcrypt from 'bcryptjs';
import { type UserRequest, type UserLogin, userPublicSchema } from '@models/user.model';
import jwt from 'jsonwebtoken';
import env from '@config/env';
import ms from 'ms';

export const registerService = async (userData: UserRequest) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        username: userData.username,
      },
    });

    if (existingUser) {
      throw new Error('Data already exists');
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
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
      throw new Error('Username atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(userData.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Username atau password salah');
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
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
      throw new Error('Access denied. Please log in first');
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
      throw new Error('Access denied. Please log in first');
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal Server Problem';
    throw new Error(errorMessage);
  }
};

export const getAllUserService = async () => {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
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

    // Parse user data into a public schema
    const parsedUser = userPublicSchema.parse(user);

    return parsedUser;
  } catch (error) {
    console.error('Error fetching user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const editUserByIdService = async (user_id: string, userData: UserRequest) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        user_id,
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Hash password before saving
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};
