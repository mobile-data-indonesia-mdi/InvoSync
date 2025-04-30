import { ZodError } from 'zod';
import type { Response } from 'express';

type ResponseData = Record<string, unknown> | unknown[] | null;

export const parseZodError = (error: ZodError) => {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach(err => {
    const field = err.path[0] as string;

    if (!formatted[field]) {
      formatted[field] = [];
    }

    formatted[field].push(err.message);
  });

  return { error: formatted };
};

export const ResponseHelper = (
  res: Response,
  status: string,
  code: number,
  message: string,
  data: ResponseData,
) => {
  res.status(code).json({
    status: status,
    code: code,
    message: message,
    data: data,
  });
};
