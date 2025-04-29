import { ZodError } from 'zod';
import type { Response } from 'express';

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

type ResponseData = Record<string, unknown> | unknown[] | null;
type ResponseStatus = 'success' | 'error';
export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 405 // Method Not Allowed
  | 406 // Not Acceptable
  | 409 // Conflict
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504; // Gateway Timeout

export type HttpStatusMessages = {
  200: 'Data successfully retrieved' | 'Data Successfully updated' | 'Successfully Login';
  201: 'Data successfully created';
  204: 'No content to display' | 'Data successfully deleted' | 'Successfully logged out';
  400: 'Invalid parameters';
  401: 'Access denied. Please log in first';
  403: 'You do not have permission to access this resource';
  404: 'Data not found' | 'Route not found';
  405: 'Method not allowed for this endpoint';
  406: 'Requested format not acceptable';
  409: 'Data already exists';
  500: 'Internal server error';
  502: 'Error contacting upstream server';
  503: 'Service unavailable, please try again later';
  504: 'Request timed out';
};

export const HttpStatusMessages: Record<HttpStatusCode, string[]> = {
  200: ['Data successfully retrieved', 'Data Successfully updated', 'Successfully Login'],
  201: ['Data successfully created'],
  204: ['No content to display', 'Data successfully deleted', 'Successfully logged out'],
  400: ['Invalid parameters'],
  401: ['Access denied. Please log in first'],
  403: ['You do not have permission to access this resource'],
  404: ['Data not found', 'Route not found'],
  405: ['Method not allowed for this endpoint'],
  406: ['Requested format not acceptable'],
  409: ['Data already exists'],
  500: ['Internal server error'],
  502: ['Error contacting upstream server'],
  503: ['Service unavailable, please try again later'],
  504: ['Request timed out'],
};

export const ResponseHelper = (
  res: Response,
  status: ResponseStatus,
  code: HttpStatusCode,
  message: HttpStatusMessages[HttpStatusCode],
  data: ResponseData,
) => {
  res.status(code).json({
    status: status,
    code: code,
    message: message,
    data: data,
  });
};
