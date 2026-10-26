import { Router, Request, Response } from 'express';
import { eventSchema, updateEventSchema } from '@rsvp/shared';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { requireOwnedEvent, requireOwnedWedding } from '../middleware/ownership';
import { validateBody } from '../middleware/validate';

const router = Router({ mergeParams: true });
router.use(requireAuth);
router.use(requireOwnedWedding);

// List events for wedding
router.get('/', async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: { weddingId: req.params.weddingId },
    orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
    include: {
      _count: {
        select: {
          households: true,
          rsvpResponses: true,
        },
      },
    },
  });

  res.json({ events });
});

// Create event for wedding
router.post('/', validateBody(eventSchema), async (req: Request, res: Response) => {
  const wedding = req.wedding!;
  const data = req.body;

  // Transaction: create event and associate all existing households to it
  const eventItem = await prisma.$transaction(async (tx) => {
    const createdEvent = await tx.event.create({
      data: {
        weddingId: wedding.id,
        name: data.name.trim(),
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        venueName: data.venueName.trim(),
        venueAddress: data.venueAddress.trim(),
        mapsUrl: data.mapsUrl || null,
        description: data.description?.trim() || null,
        cateringTarget: data.cateringTarget || null,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    // Auto-link all existing households to this new event
    const existingHouseholds = await tx.household.findMany({
      where: { weddingId: wedding.id },
      select: { id: true, invitedCount: true },
    });

    if (existingHouseholds.length > 0) {
      await tx.householdEvent.createMany({
        data: existingHouseholds.map((h) => ({
          householdId: h.id,
          eventId: createdEvent.id,
          invitedCount: h.invitedCount,
        })),
        skipDuplicates: true,
      });
    }

    return createdEvent;
  });

  res.status(201).json({ event: eventItem });
});

// Get single event
router.get('/:eventId', requireOwnedEvent, (req: Request, res: Response) => {
  res.json({ event: req.eventItem });
});

// Update event
router.patch(
  '/:eventId',
  requireOwnedEvent,
  validateBody(updateEventSchema),
  async (req: Request, res: Response) => {
    const data = req.body;

    const updated = await prisma.event.update({
      where: { id: req.params.eventId },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : undefined,
        venueName: data.venueName !== undefined ? data.venueName.trim() : undefined,
        venueAddress: data.venueAddress !== undefined ? data.venueAddress.trim() : undefined,
        mapsUrl: data.mapsUrl !== undefined ? data.mapsUrl || null : undefined,
        description:
          data.description !== undefined ? data.description?.trim() || null : undefined,
        cateringTarget:
          data.cateringTarget !== undefined ? data.cateringTarget || null : undefined,
        sortOrder: data.sortOrder,
      },
    });

    res.json({ event: updated });
  }
);

// Delete event
router.delete('/:eventId', requireOwnedEvent, async (req: Request, res: Response) => {
  await prisma.event.delete({
    where: { id: req.params.eventId },
  });

  res.json({ success: true, message: 'Event deleted successfully' });
});

export default router;
