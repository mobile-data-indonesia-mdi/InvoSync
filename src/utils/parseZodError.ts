import { ZodError } from 'zod';

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

export default parseZodError;
