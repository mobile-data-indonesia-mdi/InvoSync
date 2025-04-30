import { z } from 'zod';

export const logSchema = z.object({
  log_id: z.number().int().positive(),
  ip: z.string().ip(),
  access_token: z.string().optional(),
  username: z.string().default('Guest'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']),
  endpoint: z.string().min(1, { message: 'Endpoint is required' }),
  payload: z.object({}).optional(),
  status: z.enum(['SUCCESS', 'ERROR']),
  status_message: z.string().min(1, { message: 'Status message is required' }),
  created_at: z.date(),
});

export const logRequestSchema = logSchema.pick({
  ip: true,
  access_token: true,
  method: true,
  endpoint: true,
  payload: true,
  status: true,
  status_message: true,
});

export type LogRequest = z.infer<typeof logRequestSchema>;
