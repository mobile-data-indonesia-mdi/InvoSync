import { prisma } from '@config/db';
import jwt from 'jsonwebtoken';
import type { LogRequestSchema } from '@models/log.model';

export const createLogService = async (
  logData: LogRequestSchema
) => {
  let username = 'Guest';
  if (logData.access_token) {
    try {
      const decodedToken = jwt.verify(logData.access_token, process.env.JWT_SECRET_ACCESS as string) as {
        username: string;
        role: string;
      };
      username = decodedToken.username || 'Guest';
    } catch (error) {
      console.error('Error decoding access token:', error);
    }
  }

  let sanitizedPayload = logData.payload;
  if (sanitizedPayload && typeof sanitizedPayload === 'object' && 'password' in sanitizedPayload) {
    sanitizedPayload = { ...sanitizedPayload, password: 'REDACTED' };
  }

  await prisma.log.create({
    data: {
      ip: logData.ip,
      acces_token: logData.access_token,
      username: username,
      method: logData.method,
      endpoint: logData.endpoint,
      payload: sanitizedPayload,
      status: logData.status,
      status_message: logData.status_message,
    }
  });

  const timestamp = new Date().toISOString(); //Example output: 2023-10-01T12:00:00Z
  console.log(`[${timestamp}] - ${logData.method} ${logData.endpoint} - ${logData.status}: ${logData.status_message}`);
};
