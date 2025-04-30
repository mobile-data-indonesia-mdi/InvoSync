import type { Response } from 'express';

type ResponseData = Record<string, unknown> | unknown[] | null;

export const responseHelper = (
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

export default responseHelper;
