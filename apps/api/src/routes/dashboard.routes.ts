import { Router, Request, Response } from 'express';
import {
  calculateEventAttendance,
  deriveHouseholdStatus,
  HouseholdEventInput,
  OrganizerStatus,
  RsvpStatus,
} from '@rsvp/shared';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { requireOwnedWedding } from '../middleware/ownership';

const router = Router({ mergeParams: true });
router.use(requireAuth);
router.use(requireOwnedWedding);

router.get('/', async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const wedding = req.wedding!;

  // Event scoping: query param or earliest event
  let eventId = req.query.eventId as string | undefined;

  const events = await prisma.event.findMany({
    where: { weddingId },
    orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
  });

  if (events.length === 0) {
    res.json({
      events: [],
      selectedEvent: null,
      summary: null,
      trend: [],
      recentActivity: [],
      needsFollowUpList: [],
    });
    return;
  }

  let selectedEvent = events.find((e) => e.id === eventId);
  if (!selectedEvent) {
    selectedEvent = events[0];
    eventId = selectedEvent.id;
  }

  // Fetch all households associated with this event
  const householdEvents = await prisma.householdEvent.findMany({
    where: { eventId },
    include: {
      household: {
        include: {
          invitation: true,
          messageLogs: {
            where: { kind: 'INVITATION' },
            orderBy: { preparedAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messageLogs: { where: { kind: 'REMINDER' } },
            },
          },
        },
      },
      rsvpResponse: {
        include: {
          attendees: true,
        },
      },
    },
  });

  // Map to shared calculation input
  const calculationInputs: HouseholdEventInput[] = householdEvents.map((he) => {
    const isContacted = he.household.messageLogs.some((m) => m.status === 'MARKED_SENT');
    return {
      householdId: he.householdId,
      invitedCount: he.invitedCount,
      isContacted,
      response: he.rsvpResponse
        ? {
            status: he.rsvpResponse.status as any,
            arrivalWindow: he.rsvpResponse.arrivalWindow as any,
            attendees: he.rsvpResponse.attendees.map((a) => ({
              dietary: a.dietary as any,
              name: a.name,
            })),
          }
        : null,
    };
  });

  // Compute metrics using shared single-source-of-truth logic
  const summary = calculateEventAttendance(
    calculationInputs,
    selectedEvent.cateringTarget
  );

  // Status breakdown count and follow-up households
  const statusCounts: Record<OrganizerStatus, number> = {
    [OrganizerStatus.ATTENDING]: 0,
    [OrganizerStatus.NOT_ATTENDING]: 0,
    [OrganizerStatus.NEEDS_FOLLOW_UP]: 0,
    [OrganizerStatus.PENDING]: 0,
    [OrganizerStatus.INVITED]: 0,
    [OrganizerStatus.NOT_CONTACTED]: 0,
  };

  const needsFollowUpList: Array<{
    id: string;
    displayName: string;
    phoneE164: string;
    invitedCount: number;
    reason: string;
    doNotContact: boolean;
  }> = [];

  for (const he of householdEvents) {
    const h = he.household;
    const hasResponse = !!he.rsvpResponse;
    const confirmedCount =
      he.rsvpResponse?.status === RsvpStatus.ATTENDING
        ? he.rsvpResponse.attendees.length
        : 0;
    const hasInvitationMarkedSent = h.messageLogs.some((m) => m.status === 'MARKED_SENT');
    const firstInvitationMarkedSentAt = h.messageLogs.find(
      (m) => m.status === 'MARKED_SENT'
    )?.markedSentAt;

    const derived = deriveHouseholdStatus({
      hasResponse,
      responseStatus: he.rsvpResponse?.status as any,
      confirmedCount,
      invitedCount: he.invitedCount,
      followUpFlag: h.followUpFlag,
      rsvpDeadline: wedding.rsvpDeadline,
      invitationViewCount: h.invitation?.viewCount ?? 0,
      hasInvitationMarkedSent,
      firstInvitationMarkedSentAt,
      reminderCount: h._count.messageLogs,
    });

    statusCounts[derived.status] = (statusCounts[derived.status] || 0) + 1;

    if (derived.status === OrganizerStatus.NEEDS_FOLLOW_UP) {
      needsFollowUpList.push({
        id: h.id,
        displayName: h.displayName,
        phoneE164: h.phoneE164,
        invitedCount: he.invitedCount,
        reason: derived.reason || 'Follow-up needed',
        doNotContact: h.doNotContact,
      });
    }
  }

  // Daily confirmed attendance trend from RsvpRevision for this event
  const revisions = await prisma.rsvpRevision.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      householdId: true,
      confirmedCount: true,
      createdAt: true,
    },
  });

  // Aggregate running total per day
  const trendMap = new Map<string, number>();
  // Reconstruct household state across time
  const householdStateAtTime = new Map<string, number>();
  for (const rev of revisions) {
    householdStateAtTime.set(rev.householdId, rev.confirmedCount);
    const dayKey = rev.createdAt.toISOString().slice(0, 10);
    let totalConfirmedAtRevision = 0;
    for (const count of householdStateAtTime.values()) {
      totalConfirmedAtRevision += count;
    }
    trendMap.set(dayKey, totalConfirmedAtRevision);
  }

  const trend = Array.from(trendMap.entries()).map(([date, confirmed]) => ({
    date,
    confirmed,
  }));

  // Recent activity feed (latest revisions + messages)
  const [recentRevisions, recentMessages] = await Promise.all([
    prisma.rsvpRevision.findMany({
      where: { eventId },
      include: { household: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.messageLog.findMany({
      where: { weddingId, eventId },
      include: { household: { select: { displayName: true } } },
      orderBy: { preparedAt: 'desc' },
      take: 10,
    }),
  ]);

  const recentActivity = [
    ...recentRevisions.map((r) => ({
      id: r.id,
      type: 'RSVP_UPDATE',
      title: `${r.household.displayName} ${
        r.status === RsvpStatus.ATTENDING
          ? `confirmed ${r.confirmedCount} guest${r.confirmedCount === 1 ? '' : 's'}`
          : 'declined'
      }`,
      timestamp: r.createdAt.toISOString(),
      source: r.source,
    })),
    ...recentMessages.map((m) => ({
      id: m.id,
      type: 'MESSAGE',
      title: `${m.kind === 'INVITATION' ? 'Invitation' : 'Reminder'} ${
        m.status === 'MARKED_SENT' ? 'sent to' : 'prepared for'
      } ${m.household.displayName}`,
      timestamp: (m.markedSentAt || m.preparedAt).toISOString(),
      status: m.status,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

  res.json({
    events,
    selectedEvent,
    summary,
    statusCounts,
    trend,
    recentActivity,
    needsFollowUpList,
  });
});

export default router;
