import { LogRequestSchema } from '@models/log.model';
import { createLogService } from '@services/log.service';
import type { Request } from 'express';

const log = async (req: Request, status: 'SUCCESS' | 'ERROR', status_message: string) => {
  await createLogService({
    ip: req.ip ? req.ip : 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as LogRequestSchema['method'],
    endpoint: req.originalUrl,
    payload: req.body,
    status: status,
    status_message: status_message,
  });
};

export default log;
