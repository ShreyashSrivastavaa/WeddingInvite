import { Router, Request, Response } from 'express';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  DEFAULT_TEMPLATES,
  markSentSchema,
  MessageKind,
  MessageStatus,
  prepareMessageSchema,
  renderTemplate,
  TemplateVariables,
} from '@rsvp/shared';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { requireOwnedWedding } from '../middleware/ownership';
import { validateBody } from '../middleware/validate';
import { getMessagingProvider } from '../services/messaging.service';
import { env } from '../config/env';

const router = Router({ mergeParams: true });
router.use(requireAuth);
router.use(requireOwnedWedding);

// Send Queue: list households for invitation or reminder queue
router.get('/queue', async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const wedding = req.wedding!;
  const kind = (req.query.kind as MessageKind) || MessageKind.INVITATION;
  const eventId = req.query.eventId as string | undefined;

  // Selected event or first event
  const eventItem = eventId
    ? await prisma.event.findFirst({ where: { id: eventId, weddingId } })
    : await prisma.event.findFirst({
        where: { weddingId },
        orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
      });

  const households = await prisma.household.findMany({
    where: {
      weddingId,
      ...(eventId ? { events: { some: { eventId } } } : {}),
    },
    include: {
      invitation: true,
      events: {
        where: eventId ? { eventId } : undefined,
        include: { rsvpResponse: true },
      },
      messageLogs: {
        orderBy: { preparedAt: 'desc' },
      },
    },
    orderBy: { displayName: 'asc' },
  });

  const now = new Date();
  const coupleNames = wedding.partnerTwoName
    ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
    : wedding.partnerOneName;

  // Format date in wedding timezone
  let formattedDate = 'Upcoming';
  let eventName = wedding.title;
  let venue = 'Venue TBA';

  if (eventItem) {
    eventName = eventItem.name;
    venue = `${eventItem.venueName}, ${eventItem.venueAddress}`;
    const zoned = toZonedTime(eventItem.startsAt, wedding.timezone);
    formattedDate = format(zoned, 'EEE, d MMM yyyy, h:mm a');
  }

  const zonedDeadline = toZonedTime(wedding.rsvpDeadline, wedding.timezone);
  const formattedDeadline = format(zonedDeadline, 'd MMM yyyy');

  // Choose template
  const templateText =
    kind === MessageKind.INVITATION
      ? wedding.templateInvitation || DEFAULT_TEMPLATES.INVITATION
      : wedding.templateGentleReminder || DEFAULT_TEMPLATES.GENTLE_REMINDER;

  const provider = getMessagingProvider();

  const queueItems = [];
  const excludedItems = [];

  for (const h of households) {
    // Guardrail: Exclude doNotContact
    if (h.doNotContact) {
      excludedItems.push({
        householdId: h.id,
        displayName: h.displayName,
        phoneE164: h.phoneE164,
        reason: 'Guest or organizer opted out of communications (doNotContact=true)',
      });
      continue;
    }

    // Guardrail: Check response status for reminders
    const hasAttendingResponse = h.events.some(
      (e) => e.rsvpResponse?.status === 'ATTENDING' || e.rsvpResponse?.status === 'NOT_ATTENDING'
    );
    if (kind === MessageKind.REMINDER && hasAttendingResponse) {
      continue; // Skip already responded households in reminder queue
    }

    // Invitation token
    const token = h.invitation?.token;
    if (!token || h.invitation?.status !== 'ACTIVE') {
      excludedItems.push({
        householdId: h.id,
        displayName: h.displayName,
        phoneE164: h.phoneE164,
        reason: 'Household has no active invitation link',
      });
      continue;
    }

    const rsvpLink = `${env.APP_URL}/r/${token}`;
    const vars: TemplateVariables = {
      guest_name: h.displayName,
      couple_names: coupleNames,
      event_name: eventName,
      date: formattedDate,
      venue,
      deadline: formattedDeadline,
      rsvp_link: rsvpLink,
    };

    const rendered = renderTemplate(templateText, vars);

    // Guardrail: Warn if reminded within the last 48 hours
    const recentReminder = h.messageLogs.find(
      (m) =>
        m.kind === 'REMINDER' &&
        m.status === 'MARKED_SENT' &&
        m.markedSentAt &&
        now.getTime() - m.markedSentAt.getTime() < 48 * 60 * 60 * 1000
    );

    const reminderCount = h.messageLogs.filter(
      (m) => m.kind === 'REMINDER' && m.status === 'MARKED_SENT'
    ).length;
    const lastSentLog = h.messageLogs.find((m) => m.status === 'MARKED_SENT');

    // Generate wa.me URL
    const prepared = await provider.prepareMessage({
      recipientPhoneE164: h.phoneE164,
      messageText: rendered.text,
      templateKey: kind,
    });

    queueItems.push({
      householdId: h.id,
      displayName: h.displayName,
      phoneE164: h.phoneE164,
      invitedCount: h.invitedCount,
      templateText,
      renderedText: rendered.text,
      isValid: rendered.isValid,
      missingVariables: rendered.missingVariables,
      whatsAppUrl: prepared.externalUrl,
      reminderCount,
      lastContactedAt: lastSentLog?.markedSentAt || null,
      warnRecentContact: !!recentReminder,
      recentContactNotice: recentReminder
        ? `Reminded within the last 48 hours (${format(
            recentReminder.markedSentAt!,
            'd MMM, h:mm a'
          )})`
        : null,
    });
  }

  res.json({
    kind,
    totalEligible: queueItems.length,
    items: queueItems,
    excluded: excludedItems,
  });
});

// Prepare Message: creates MessageLog in PREPARED state and returns wa.me URL
router.post('/prepare', validateBody(prepareMessageSchema), async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const { householdId, eventId, kind, templateKey, body } = req.body;

  const household = await prisma.household.findFirst({
    where: { id: householdId, weddingId },
  });

  if (!household) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Household not found' } });
    return;
  }

  const provider = getMessagingProvider();
  const prepared = await provider.prepareMessage({
    recipientPhoneE164: household.phoneE164,
    messageText: body,
    templateKey,
  });

  const messageLog = await prisma.messageLog.create({
    data: {
      weddingId,
      householdId: household.id,
      eventId: eventId || null,
      kind,
      channel: prepared.channel,
      status: MessageStatus.PREPARED,
      templateKey,
      bodySnapshot: body,
      createdByUserId: req.user!.id,
    },
  });

  res.status(201).json({
    messageLogId: messageLog.id,
    status: messageLog.status,
    whatsAppUrl: prepared.externalUrl,
  });
});

// Mark Sent: organizer asserts "I sent it"
router.post('/mark-sent', validateBody(markSentSchema), async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const { messageLogId } = req.body;

  const log = await prisma.messageLog.findFirst({
    where: { id: messageLogId, weddingId },
  });

  if (!log) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Message log not found' } });
    return;
  }

  const updated = await prisma.messageLog.update({
    where: { id: log.id },
    data: {
      status: MessageStatus.MARKED_SENT,
      markedSentAt: new Date(),
    },
  });

  res.json({
    success: true,
    messageLog: updated,
    statusDisplay: 'Marked as sent by you',
  });
});

// Message history for wedding or household
router.get('/history', async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const householdId = req.query.householdId as string | undefined;

  const logs = await prisma.messageLog.findMany({
    where: {
      weddingId,
      ...(householdId ? { householdId } : {}),
    },
    include: {
      household: { select: { id: true, displayName: true, phoneE164: true } },
      event: { select: { id: true, name: true } },
    },
    orderBy: { preparedAt: 'desc' },
    take: 100,
  });

  res.json({ logs });
});

export default router;
