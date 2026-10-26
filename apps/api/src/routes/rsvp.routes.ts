import { Router, Request, Response } from 'express';
import {
  householdRsvpSubmissionSchema,
  OptOutSource,
  PublicInvitationDetails,
  RsvpSource,
  RsvpStatus,
} from '@rsvp/shared';
import { prisma } from '../db/prisma';
import { rsvpRateLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

const router = Router();
router.use(rsvpRateLimiter);

// Middleware to set privacy headers on all public RSVP routes
router.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Safe error helper: returns generic, non-revealing message
function sendInvalidTokenResponse(res: Response): void {
  res.status(404).json({
    error: {
      code: 'INVALID_TOKEN',
      message: "This invitation link isn't active. Please contact the family.",
    },
  });
}

// Fetch public invitation details by token
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token || typeof token !== 'string') {
    return sendInvalidTokenResponse(res);
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      household: {
        include: {
          wedding: true,
          events: {
            include: {
              event: true,
              rsvpResponse: {
                include: {
                  attendees: {
                    orderBy: { position: 'asc' },
                  },
                },
              },
            },
            orderBy: { event: { startsAt: 'asc' } },
          },
        },
      },
    },
  });

  if (!invitation || invitation.status !== 'ACTIVE') {
    return sendInvalidTokenResponse(res);
  }

  // Check expiration if set
  if (invitation.expiresAt && invitation.expiresAt.getTime() <= Date.now()) {
    return sendInvalidTokenResponse(res);
  }

  const household = invitation.household;
  const wedding = household.wedding;

  // Track invitation views
  const now = new Date();
  await prisma.invitation
    .update({
      where: { id: invitation.id },
      data: {
        viewCount: { increment: 1 },
        firstViewedAt: invitation.firstViewedAt || now,
        lastViewedAt: now,
      },
    })
    .catch(() => {});

  const responsePayload: PublicInvitationDetails = {
    token: invitation.token,
    household: {
      id: household.id,
      displayName: household.displayName,
      invitedCount: household.invitedCount,
      doNotContact: household.doNotContact,
    },
    wedding: {
      id: wedding.id,
      title: wedding.title,
      partnerOneName: wedding.partnerOneName,
      partnerTwoName: wedding.partnerTwoName,
      invitationMessage: wedding.invitationMessage,
      rsvpDeadline: wedding.rsvpDeadline.toISOString(),
      timezone: wedding.timezone,
      dietaryOptions: wedding.dietaryOptions as any,
      theme: wedding.theme,
      coverImageUrl: wedding.coverImageUrl,
      allowChangesAfterDeadline: wedding.allowChangesAfterDeadline,
    },
    events: household.events.map((he) => ({
      id: he.event.id,
      name: he.event.name,
      startsAt: he.event.startsAt.toISOString(),
      endsAt: he.event.endsAt ? he.event.endsAt.toISOString() : null,
      venueName: he.event.venueName,
      venueAddress: he.event.venueAddress,
      mapsUrl: he.event.mapsUrl,
      description: he.event.description,
      invitedCount: he.invitedCount,
      currentResponse: he.rsvpResponse
        ? {
            status: he.rsvpResponse.status as any,
            arrivalWindow: he.rsvpResponse.arrivalWindow as any,
            message: he.rsvpResponse.message,
            extraSeatsRequested: he.rsvpResponse.extraSeatsRequested,
            version: he.rsvpResponse.version,
            respondedAt: he.rsvpResponse.respondedAt.toISOString(),
            attendees: he.rsvpResponse.attendees.map((a) => ({
              name: a.name,
              dietary: a.dietary as any,
              dietaryNote: a.dietaryNote,
            })),
          }
        : null,
    })),
  };

  res.json(responsePayload);
});

// Guest RSVP submission across invited events
router.post(
  '/:token/submit',
  validateBody(householdRsvpSubmissionSchema),
  async (req: Request, res: Response) => {
    const { token } = req.params;
    const { events, expectedVersion } = req.body;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        household: {
          include: {
            wedding: true,
            events: {
              include: {
                rsvpResponse: true,
              },
            },
          },
        },
      },
    });

    if (!invitation || invitation.status !== 'ACTIVE') {
      return sendInvalidTokenResponse(res);
    }

    const household = invitation.household;
    const wedding = household.wedding;

    // Check deadline constraints
    const now = new Date();
    const isDeadlinePassed = now.getTime() > wedding.rsvpDeadline.getTime();
    if (isDeadlinePassed && !wedding.allowChangesAfterDeadline) {
      res.status(403).json({
        error: {
          code: 'DEADLINE_PASSED',
          message:
            'The RSVP deadline has passed and responses can no longer be modified online. Please contact the family directly.',
        },
      });
      return;
    }

    // Verify optimistic locking / stale version check
    if (typeof expectedVersion === 'number') {
      const currentVersions = household.events
        .map((e) => e.rsvpResponse?.version || 0);
      const maxCurrentVersion = currentVersions.length > 0 ? Math.max(...currentVersions) : 0;

      if (expectedVersion !== maxCurrentVersion) {
        res.status(409).json({
          error: {
            code: 'VERSION_CONFLICT',
            message:
              'This RSVP was updated from another device. Please refresh the page to view the latest details.',
          },
        });
        return;
      }
    }

    // Validate that household is invited to each event in submission and attendee caps
    for (const sub of events) {
      const he = household.events.find((e) => e.eventId === sub.eventId);
      if (!he) {
        res.status(400).json({
          error: {
            code: 'INVALID_EVENT',
            message: 'You are not invited to one of the selected events.',
          },
        });
        return;
      }

      if (sub.status === RsvpStatus.ATTENDING) {
        if (sub.attendees.length < 1 || sub.attendees.length > he.invitedCount) {
          res.status(400).json({
            error: {
              code: 'INVALID_ATTENDEE_COUNT',
              message: `Attendee count must be between 1 and ${he.invitedCount} for this event.`,
            },
          });
          return;
        }
      }
    }

    // Idempotent replace-state in one single transaction
    let newMaxVersion = 1;
    await prisma.$transaction(async (tx) => {
      for (const sub of events) {
        const existing = await tx.rsvpResponse.findUnique({
          where: {
            householdId_eventId: {
              householdId: household.id,
              eventId: sub.eventId,
            },
          },
        });

        const nextVersion = (existing?.version || 0) + 1;
        if (nextVersion > newMaxVersion) {
          newMaxVersion = nextVersion;
        }

        const response = await tx.rsvpResponse.upsert({
          where: {
            householdId_eventId: {
              householdId: household.id,
              eventId: sub.eventId,
            },
          },
          update: {
            status: sub.status,
            arrivalWindow: sub.arrivalWindow || null,
            message: sub.message?.trim() || null,
            extraSeatsRequested: sub.extraSeatsRequested || null,
            source: RsvpSource.GUEST_LINK,
            version: nextVersion,
            respondedAt: now,
          },
          create: {
            householdId: household.id,
            eventId: sub.eventId,
            status: sub.status,
            arrivalWindow: sub.arrivalWindow || null,
            message: sub.message?.trim() || null,
            extraSeatsRequested: sub.extraSeatsRequested || null,
            source: RsvpSource.GUEST_LINK,
            version: nextVersion,
            respondedAt: now,
          },
        });

        // Replace attendees
        await tx.attendee.deleteMany({
          where: { rsvpResponseId: response.id },
        });

        if (sub.status === RsvpStatus.ATTENDING) {
          await tx.attendee.createMany({
            data: sub.attendees.map((a: any, idx: number) => ({
              rsvpResponseId: response.id,
              position: idx + 1,
              name: a.name?.trim() || `Guest ${idx + 1}`,
              dietary: a.dietary,
              dietaryNote: a.dietaryNote?.trim() || null,
            })),
          });
        }

        // Record revision history snapshot
        const confirmedCount = sub.status === RsvpStatus.ATTENDING ? sub.attendees.length : 0;
        await tx.rsvpRevision.create({
          data: {
            householdId: household.id,
            eventId: sub.eventId,
            status: sub.status,
            confirmedCount,
            dietarySnapshot: sub.attendees as any,
            source: RsvpSource.GUEST_LINK,
          },
        });
      }

      // Automatically clear follow-up flag upon response
      await tx.household.update({
        where: { id: household.id },
        data: { followUpFlag: false },
      });
    });

    res.json({
      success: true,
      version: newMaxVersion,
      message: 'Thank you! Your RSVP has been received.',
    });
  }
);

// Guest one-tap opt-out from reminders
router.post('/:token/opt-out', async (req: Request, res: Response) => {
  const { token } = req.params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { householdId: true, status: true },
  });

  if (!invitation || invitation.status !== 'ACTIVE') {
    return sendInvalidTokenResponse(res);
  }

  await prisma.household.update({
    where: { id: invitation.householdId },
    data: {
      doNotContact: true,
      optOutAt: new Date(),
      optOutSource: OptOutSource.GUEST,
    },
  });

  res.json({
    success: true,
    message: "You have been unsubscribed from WhatsApp reminders for this wedding.",
  });
});

export default router;
