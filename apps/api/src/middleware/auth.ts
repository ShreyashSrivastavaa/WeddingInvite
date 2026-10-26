import { Request, Response, NextFunction } from 'express';
import { User, Session } from '@prisma/client';
import { SESSION_DURATION_MS } from '@rsvp/shared';
import { prisma } from '../db/prisma';
import { hashSessionToken, SESSION_COOKIE_NAME } from '../utils/auth';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
      session?: Session | null;
      id?: string;
    }
  }
}

/**
 * Attaches user and session if a valid session cookie exists and slides expiry.
 */
export async function authenticateSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token || typeof token !== 'string') {
    req.user = null;
    req.session = null;
    return next();
  }

  try {
    const tokenHash = hashSessionToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) {
        // Expired session - delete it
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      req.user = null;
      req.session = null;
      return next();
    }

    req.user = session.user;
    req.session = session;

    // Slide session expiry if more than 1 day has elapsed
    const oneDayAgo = Date.now() + SESSION_DURATION_MS - 24 * 60 * 60 * 1000;
    if (session.expiresAt.getTime() < oneDayAgo) {
      prisma.session
        .update({
          where: { id: session.id },
          data: { expiresAt: new Date(Date.now() + SESSION_DURATION_MS) },
        })
        .catch(() => {});
    }

    return next();
  } catch (error) {
    req.user = null;
    req.session = null;
    return next();
  }
}

/**
 * Route guard requiring an authenticated user
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be signed in to access this resource.',
      },
    });
    return;
  }
  next();
}

/**
 * CSRF check for state-changing authenticated requests
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // If unauthenticated or public route, allow
  if (!req.user) {
    return next();
  }

  const origin = req.headers['origin'] || req.headers['referer'];
  const requestedWith = req.headers['x-requested-with'];

  if (requestedWith === 'XMLHttpRequest') {
    return next();
  }

  if (origin) {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
    const isAllowed = allowedOrigins.some((allowed) => origin.startsWith(allowed));
    if (isAllowed || env.NODE_ENV === 'test') {
      return next();
    }
  }

  // In test mode or local same-origin, pass
  if (env.NODE_ENV === 'test' || !origin) {
    return next();
  }

  res.status(403).json({
    error: {
      code: 'CSRF_FAILED',
      message: 'Cross-site request validation failed.',
    },
  });
}
