import { z } from 'zod';

export const logSchema = z.object({
  log_id: z.number().int().positive(),
  action: z.string().min(1, { message: 'Action is required' }),
  status: z.enum(['success', 'failed']),
  user_id: z.string().uuid(),
  created_at: z.date(),
});

export const logRequestSchema = logSchema.pick({
  action: true,
  status: true,
  user_id: true,
});

export type LogRequestSchema = z.infer<typeof logRequestSchema>;