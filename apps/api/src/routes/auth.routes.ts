import { Router, Request, Response } from 'express';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
  SESSION_DURATION_MS,
} from '@rsvp/shared';
import { prisma } from '../db/prisma';
import {
  clearSessionCookie,
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  setSessionCookie,
  verifyPassword,
} from '../utils/auth';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

const router = Router();

// Register new organizer
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response) => {
    const { name, email, password, businessName } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email already exists.',
        },
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        businessName: businessName?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        createdAt: true,
      },
    });

    // Create session
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    setSessionCookie(res, rawToken);
    res.status(201).json({ user });
  }
);

// Login organizer
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    // Session rotation on login: delete old sessions for this device if cookie existed
    const existingRawToken = req.cookies?.rsvp_session;
    if (existingRawToken) {
      const existingHash = hashSessionToken(existingRawToken);
      await prisma.session.deleteMany({ where: { tokenHash: existingHash } }).catch(() => {});
    }

    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    setSessionCookie(res, rawToken);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessName: user.businessName,
        createdAt: user.createdAt,
      },
    });
  }
);

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.rsvp_session;
  if (token) {
    const tokenHash = hashSessionToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Current user profile
router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ user: null });
    return;
  }

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      businessName: req.user.businessName,
      createdAt: req.user.createdAt,
    },
  });
});

// Update Profile
router.patch(
  '/profile',
  requireAuth,
  validateBody(updateProfileSchema),
  async (req: Request, res: Response) => {
    const { name, businessName } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name.trim(),
        businessName: businessName !== undefined ? businessName?.trim() || null : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        createdAt: true,
      },
    });

    res.json({ user: updated });
  }
);

// Change password
router.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'User not found' },
      });
      return;
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect.',
        },
      });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  }
);

export default router;
