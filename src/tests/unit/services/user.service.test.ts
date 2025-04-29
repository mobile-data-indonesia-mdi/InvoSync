import { registerService } from '@services/user.service';
import bcrypt from 'bcryptjs';
import { prisma } from '@config/db';
import type { UserRequest } from '@models/user.model';

jest.mock('bcrypt');
jest.mock('@config/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('registerService', () => {
  const mockUserData: UserRequest = {
    username: 'john_doe',
    password: 'password123',
    role: 'finance',
  };

  it('should register a new user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      username: 'john_doe',
      password: 'hashed_password',
      role: 'finance',
    });

    const result = await registerService(mockUserData);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'john_doe' },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(prisma.user.create).toHaveBeenCalled();
    expect(result.username).toBe('john_doe');
  });

  it('should throw error if user exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

    await expect(registerService(mockUserData)).rejects.toThrow('Data already exists');
  });
});
