import { Request, Response, NextFunction } from 'express';
import { Wedding, Event, Household } from '@prisma/client';
import { prisma } from '../db/prisma';

declare global {
  namespace Express {
    interface Request {
      wedding?: Wedding;
      eventItem?: Event;
      household?: Household;
    }
  }
}

/**
 * Ensures the wedding exists AND belongs to the authenticated user.
 * Strictly returns 404 for unowned weddings to prevent resource enumeration.
 */
export async function requireOwnedWedding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const weddingId = req.params.weddingId || req.body?.weddingId;

  if (!weddingId || typeof weddingId !== 'string') {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Wedding ID is required' },
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  const wedding = await prisma.wedding.findFirst({
    where: {
      id: weddingId,
      ownerId: req.user.id,
    },
  });

  if (!wedding) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Wedding not found' },
    });
    return;
  }

  req.wedding = wedding;
  next();
}

/**
 * Ensures an event belongs to an owned wedding.
 */
export async function requireOwnedEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const weddingId = req.params.weddingId;
  const eventId = req.params.eventId;

  if (!weddingId || !eventId) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Wedding ID and Event ID are required' },
    });
    return;
  }

  const eventItem = await prisma.event.findFirst({
    where: {
      id: eventId,
      wedding: {
        id: weddingId,
        ownerId: req.user!.id,
      },
    },
  });

  if (!eventItem) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Event not found' },
    });
    return;
  }

  req.eventItem = eventItem;
  next();
}

/**
 * Ensures a household belongs to an owned wedding.
 */
export async function requireOwnedHousehold(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const weddingId = req.params.weddingId;
  const householdId = req.params.householdId;

  if (!weddingId || !householdId) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Wedding ID and Household ID are required' },
    });
    return;
  }

  const household = await prisma.household.findFirst({
    where: {
      id: householdId,
      wedding: {
        id: weddingId,
        ownerId: req.user!.id,
      },
    },
  });

  if (!household) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Household not found' },
    });
    return;
  }

  req.household = household;
  next();
}
