import crypto from 'crypto';
import { hash, verify } from '@node-rs/argon2';
import { Response } from 'express';
import { SESSION_DURATION_MS } from '@rsvp/shared';
import { env } from '../config/env';

export const SESSION_COOKIE_NAME = 'rsvp_session';

/**
 * Hash password using argon2id
 */
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verify password against argon2id hash
 */
export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Compute SHA-256 hash of a session token for secure DB storage
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Set session cookie on response with HttpOnly, SameSite=Lax, Secure in production
 */
export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
