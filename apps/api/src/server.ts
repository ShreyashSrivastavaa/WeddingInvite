import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from './config/env';
import { authenticateSession, csrfProtection } from './middleware/auth';
import { logger } from './utils/logger';

// Import route modules
import authRoutes from './routes/auth.routes';
import weddingRoutes from './routes/wedding.routes';
import eventRoutes from './routes/event.routes';
import householdRoutes from './routes/household.routes';
import dashboardRoutes from './routes/dashboard.routes';
import messageRoutes from './routes/message.routes';
import rsvpRoutes from './routes/rsvp.routes';

import { prisma } from './db/prisma';

export function createServer() {
  const app = express();

  // Trust proxy for production reverse proxies (e.g. Render, Railway)
  app.set('trust proxy', env.TRUST_PROXY);

  // Security headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", 'https:', 'http:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Body parsing & Cookie parser
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Request ID and logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.id = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  });

  // Session authentication & CSRF
  app.use(authenticateSession);
  app.use(csrfProtection);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      product: 'RSVP Wedding Manager',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // API Route mounting
  app.use('/api/auth', authRoutes);
  app.use('/api/weddings', weddingRoutes);
  app.use('/api/weddings/:weddingId/events', eventRoutes);
  app.use('/api/weddings/:weddingId/households', householdRoutes);
  app.use('/api/weddings/:weddingId/dashboard', dashboardRoutes);
  app.use('/api/weddings/:weddingId/messages', messageRoutes);
  app.use('/api/rsvp', rsvpRoutes);

  // In production (or if built SPA exists), serve web/dist
  const candidatePaths = [
    path.resolve(__dirname, '../../web/dist'),
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(process.cwd(), '../web/dist'),
    path.resolve(process.cwd(), 'dist'),
  ];
  const webDistPath = candidatePaths.find((p) => fs.existsSync(p));
  if (webDistPath) {
    app.use(express.static(webDistPath));
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      const indexPath = path.join(webDistPath, 'index.html');

      // P1: Open Graph link preview injection for WhatsApp / social crawlers on /r/:token
      if (req.path.startsWith('/r/')) {
        const token = req.path.split('/')[2];
        if (token) {
          try {
            const invitation = await prisma.invitation.findUnique({
              where: { token },
              include: {
                household: {
                  include: {
                    wedding: true,
                  },
                },
              },
            });

            if (invitation && invitation.status === 'ACTIVE') {
              const wedding = invitation.household.wedding;
              const couple = wedding.partnerTwoName
                ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
                : wedding.partnerOneName;
              let html = fs.readFileSync(indexPath, 'utf-8');

              const ogTitle = `${couple}'s Wedding — RSVP`;
              const ogDesc = `Special wedding invitation for ${invitation.household.displayName}. Please confirm your attendance details.`;
              const ogImage = wedding.coverImageUrl || `${env.APP_URL}/favicon.ico`;

              const ogTags = `
    <title>${ogTitle}</title>
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDesc}" />`;

              html = html.replace('</head>', `${ogTags}\n  </head>`);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('X-Robots-Tag', 'noindex');
              res.setHeader('Referrer-Policy', 'no-referrer');
              res.send(html);
              return;
            }
          } catch {
            // fallback to default SPA index
          }
        }
      }

      res.sendFile(indexPath);
    });
  }

  // 404 Handler for API routes
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested API route was not found.',
      },
    });
  });

  // Centralized Error Handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err, reqId: req.id }, 'Unhandled error');

    const status = err.status || err.statusCode || 500;
    const message =
      env.NODE_ENV === 'production' && status === 500
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal server error';

    res.status(status).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message,
        fieldErrors: err.fieldErrors,
      },
    });
  });

  return app;
}
