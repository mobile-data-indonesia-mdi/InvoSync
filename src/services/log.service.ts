import { prisma } from '@config/db';
import jwt from 'jsonwebtoken';
import type { LogRequest } from '@models/log.model';
import { logRequestSchema } from '@models/log.model';

export const createLogService = async (logData: LogRequest) => {
  const validate = await logRequestSchema.safeParseAsync(logData);

  if (!validate.success) {
    console.error('Invalid log data:', validate.error);
    return;
  }

  const username = logData.access_token
    ? (() => {
        try {
          const decodedToken = jwt.verify(
            logData.access_token,
            process.env.JWT_SECRET_ACCESS as string,
          ) as { username: string; role: string };
          return decodedToken.username || 'Guest';
        } catch (error) {
          console.error('Error decoding access token:', error);
          return 'Guest';
        }
      })()
    : 'Guest';

  const sanitizedPayload =
    logData.payload && typeof logData.payload === 'object' && 'password' in logData.payload
      ? { ...logData.payload, password: 'REDACTED' }
      : logData.payload;

  await prisma.log.create({
    data: {
      ip: logData.ip,
      acces_token: logData.access_token,
      username,
      method: logData.method,
      endpoint: logData.endpoint,
      payload: sanitizedPayload,
      status: logData.status,
      status_message: logData.status_message,
    },
  });

  console.log(
    `[${new Date().toISOString()}] - ${logData.method} ${logData.endpoint} - ${logData.status}: ${logData.status_message}`,
  );
};
