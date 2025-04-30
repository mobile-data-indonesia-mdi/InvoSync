import { LogRequest } from '@models/log.model';
import { createLogService } from '@services/log.service';
import type { Request } from 'express';

export async function log(req: Request, status: 'SUCCESS' | 'ERROR', status_message: string) {
  await createLogService({
    ip: req.ip ? req.ip : 'unknown',
    access_token: req.cookies['accessToken'],
    method: req.method as LogRequest['method'],
    endpoint: req.originalUrl,
    payload: req.body,
    status: status,
    status_message: status_message,
  });
}

export default log;
