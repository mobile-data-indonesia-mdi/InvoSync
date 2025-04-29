import { prisma } from '@config/db';

export const createLogService = async (
  userId: string,
  action: string,
  status: 'success' | 'failed'
) => {
  await prisma.log.create({
    data: {
      user_id: userId,
      action,
      status,
    }
  });
};
