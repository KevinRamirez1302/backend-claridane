import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  id: number;
  rol: 'admin' | 'socio';
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

/** Calculates the expiry date for the refresh token to store in DB */
export function refreshTokenExpiry(): Date {
  const days = parseInt(env.JWT_REFRESH_EXPIRES.replace('d', ''), 10) || 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
