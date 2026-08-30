import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number }
) {
  return res.status(200).json({ success: true, data, meta });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string
) {
  return res.status(statusCode).json({ success: false, error: { code, message } });
}
