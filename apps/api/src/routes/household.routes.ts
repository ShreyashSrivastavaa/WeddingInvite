import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';
import {
  Category,
  deriveHouseholdStatus,
  formatPhoneDisplay,
  generateCsv,
  householdSchema,
  normalizePhone,
  OptOutSource,
  OrganizerStatus,
  RsvpSource,
  RsvpStatus,
  Side,
  updateHouseholdSchema,
  CSV_MAX_FILE_SIZE_BYTES,
  CSV_MAX_ROWS,
  TOKEN_BYTES,
  householdRsvpSubmissionSchema,
  Dietary,
} from '@rsvp/shared';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { requireOwnedHousehold, requireOwnedWedding } from '../middleware/ownership';
import { importExportRateLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

const router = Router({ mergeParams: true });
router.use(requireAuth);
router.use(requireOwnedWedding);

// Helper to generate secure 24-byte base64url token
function generateInvitationToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

// List households with pagination, search, and filters
router.get('/', async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
  const skip = (page - 1) * limit;

  const search = (req.query.search as string)?.trim();
  const category = req.query.category as Category | undefined;
  const statusFilter = req.query.status as string | undefined;
  const eventId = req.query.eventId as string | undefined;

  const whereClause: any = {
    weddingId,
  };

  if (category && Object.values(Category).includes(category)) {
    whereClause.category = category;
  }

  if (search) {
    whereClause.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { phoneE164: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Fetch wedding deadline for status derivation
  const wedding = req.wedding!;

  // Fetch all households matching basic filter
  const [totalCount, rawHouseholds] = await Promise.all([
    prisma.household.count({ where: whereClause }),
    prisma.household.findMany({
      where: whereClause,
      include: {
        invitation: true,
        events: {
          include: {
            event: true,
            rsvpResponse: {
              include: {
                attendees: true,
              },
            },
          },
        },
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
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Derive status per household (scoped to eventId if provided, else overall)
  const enrichedHouseholds = rawHouseholds.map((h) => {
    // Find relevant response
    let relevantResponse = null;
    let relevantInvitedCount = h.invitedCount;

    if (eventId) {
      const he = h.events.find((e) => e.eventId === eventId);
      if (he) {
        relevantInvitedCount = he.invitedCount;
        relevantResponse = he.rsvpResponse;
      }
    } else if (h.events.length > 0) {
      // If no eventId specified, check if any event has a response
      const respondedEvent = h.events.find((e) => e.rsvpResponse);
      if (respondedEvent) {
        relevantResponse = respondedEvent.rsvpResponse;
        relevantInvitedCount = respondedEvent.invitedCount;
      }
    }

    const confirmedCount =
      relevantResponse?.status === RsvpStatus.ATTENDING
        ? relevantResponse.attendees.length
        : 0;

    const hasInvitationMarkedSent = h.messageLogs.some((m) => m.status === 'MARKED_SENT');
    const firstInvitationMarkedSentAt = h.messageLogs.find(
      (m) => m.status === 'MARKED_SENT'
    )?.markedSentAt;

    const derived = deriveHouseholdStatus({
      hasResponse: !!relevantResponse,
      responseStatus: relevantResponse?.status as any,
      confirmedCount,
      invitedCount: relevantInvitedCount,
      followUpFlag: h.followUpFlag,
      rsvpDeadline: wedding.rsvpDeadline,
      invitationViewCount: h.invitation?.viewCount ?? 0,
      hasInvitationMarkedSent,
      firstInvitationMarkedSentAt,
      reminderCount: h._count.messageLogs,
    });

    return {
      id: h.id,
      displayName: h.displayName,
      phoneE164: h.phoneE164,
      phoneFormatted: formatPhoneDisplay(h.phoneE164),
      email: h.email,
      category: h.category,
      side: h.side,
      notes: h.notes,
      memberNames: h.memberNames,
      invitedCount: h.invitedCount,
      followUpFlag: h.followUpFlag,
      doNotContact: h.doNotContact,
      invitation: h.invitation
        ? {
            id: h.invitation.id,
            token: h.invitation.token,
            status: h.invitation.status,
            viewCount: h.invitation.viewCount,
            firstViewedAt: h.invitation.firstViewedAt,
            lastViewedAt: h.invitation.lastViewedAt,
          }
        : null,
      status: derived.status,
      statusLabel: derived.label,
      statusReason: derived.reason,
      confirmedCount,
      hasResponse: !!relevantResponse,
      responseDetails: relevantResponse
        ? {
            status: relevantResponse.status,
            arrivalWindow: relevantResponse.arrivalWindow,
            message: relevantResponse.message,
            extraSeatsRequested: relevantResponse.extraSeatsRequested,
            attendees: relevantResponse.attendees.map((a) => ({
              name: a.name,
              dietary: a.dietary,
              dietaryNote: a.dietaryNote,
            })),
          }
        : null,
      lastContactedAt: firstInvitationMarkedSentAt || null,
      createdAt: h.createdAt,
    };
  });

  // Filter by derived status if specified
  let filtered = enrichedHouseholds;
  if (statusFilter) {
    filtered = enrichedHouseholds.filter((h) => h.status === statusFilter);
  }

  const paginated = filtered.slice(skip, skip + limit);

  res.json({
    households: paginated,
    pagination: {
      page,
      limit,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
  });
});

// Create single household
router.post('/', validateBody(householdSchema), async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const data = req.body;

  // Normalize phone
  const phoneResult = normalizePhone(data.phone);
  if (!phoneResult.success || !phoneResult.phoneE164) {
    res.status(400).json({
      error: { code: 'INVALID_PHONE', message: phoneResult.error },
    });
    return;
  }
  const phoneE164 = phoneResult.phoneE164;

  // Check for duplicate phone in this wedding (non-blocking warning check)
  const existingWithPhone = await prisma.household.findFirst({
    where: { weddingId, phoneE164 },
    select: { id: true, displayName: true },
  });

  // Fetch wedding events to associate
  const weddingEvents = await prisma.event.findMany({
    where: { weddingId },
    select: { id: true },
  });

  const household = await prisma.$transaction(async (tx) => {
    const created = await tx.household.create({
      data: {
        weddingId,
        displayName: data.displayName.trim(),
        phoneE164,
        email: data.email?.toLowerCase().trim() || null,
        category: data.category,
        side: data.side || null,
        notes: data.notes?.trim() || null,
        memberNames: data.memberNames || [],
        invitedCount: data.invitedCount,
        followUpFlag: data.followUpFlag ?? false,
        doNotContact: data.doNotContact ?? false,
      },
    });

    // Create unique invitation token
    const token = generateInvitationToken();
    const invitation = await tx.invitation.create({
      data: {
        householdId: created.id,
        token,
      },
    });

    // Associate to wedding events with invitedCount or overrides
    if (weddingEvents.length > 0) {
      const overrides = data.eventInvitedOverrides || [];
      const heData = weddingEvents
        .filter((ev) => {
          const override = overrides.find((o: any) => o.eventId === ev.id);
          return override ? override.invited : true;
        })
        .map((ev) => {
          const override = overrides.find((o: any) => o.eventId === ev.id);
          return {
            householdId: created.id,
            eventId: ev.id,
            invitedCount: override?.invitedCount || data.invitedCount,
          };
        });

      if (heData.length > 0) {
        await tx.householdEvent.createMany({ data: heData });
      }
    }

    return { ...created, invitation };
  });

  res.status(201).json({
    household,
    duplicateWarning: existingWithPhone
      ? {
          existingHouseholdId: existingWithPhone.id,
          existingHouseholdName: existingWithPhone.displayName,
          message: `Phone number is also used by "${existingWithPhone.displayName}".`,
        }
      : null,
  });
});

// Get single household with drawer details
router.get('/:householdId', requireOwnedHousehold, async (req: Request, res: Response) => {
  const household = await prisma.household.findUnique({
    where: { id: req.params.householdId },
    include: {
      invitation: true,
      events: {
        include: {
          event: true,
          rsvpResponse: {
            include: {
              attendees: { orderBy: { position: 'asc' } },
            },
          },
        },
        orderBy: { event: { startsAt: 'asc' } },
      },
      rsvpRevisions: {
        include: { event: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      messageLogs: {
        orderBy: { preparedAt: 'desc' },
        take: 30,
      },
    },
  });

  res.json({ household });
});

// Update household
router.patch(
  '/:householdId',
  requireOwnedHousehold,
  validateBody(updateHouseholdSchema),
  async (req: Request, res: Response) => {
    const data = req.body;
    let phoneE164: string | undefined;

    if (data.phone) {
      const phoneResult = normalizePhone(data.phone);
      if (!phoneResult.success || !phoneResult.phoneE164) {
        res.status(400).json({
          error: { code: 'INVALID_PHONE', message: phoneResult.error },
        });
        return;
      }
      phoneE164 = phoneResult.phoneE164;
    }

    const updated = await prisma.household.update({
      where: { id: req.params.householdId },
      data: {
        displayName: data.displayName !== undefined ? data.displayName.trim() : undefined,
        phoneE164,
        email: data.email !== undefined ? (data.email ? data.email.toLowerCase().trim() : null) : undefined,
        category: data.category,
        side: data.side !== undefined ? data.side : undefined,
        notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : undefined,
        memberNames: data.memberNames,
        invitedCount: data.invitedCount,
        followUpFlag: data.followUpFlag,
        doNotContact: data.doNotContact,
      },
      include: {
        invitation: true,
      },
    });

    res.json({ household: updated });
  }
);

// Delete household
router.delete('/:householdId', requireOwnedHousehold, async (req: Request, res: Response) => {
  await prisma.household.delete({
    where: { id: req.params.householdId },
  });

  res.json({ success: true, message: 'Household deleted successfully' });
});

// Toggle follow-up flag
router.patch('/:householdId/follow-up', requireOwnedHousehold, async (req: Request, res: Response) => {
  const current = req.household!;
  const updated = await prisma.household.update({
    where: { id: current.id },
    data: { followUpFlag: !current.followUpFlag },
  });

  res.json({ household: updated });
});

// Toggle doNotContact (Organizer source)
router.patch('/:householdId/opt-out', requireOwnedHousehold, async (req: Request, res: Response) => {
  const current = req.household!;
  const nextDoNotContact = !current.doNotContact;

  const updated = await prisma.household.update({
    where: { id: current.id },
    data: {
      doNotContact: nextDoNotContact,
      optOutAt: nextDoNotContact ? new Date() : null,
      optOutSource: nextDoNotContact ? OptOutSource.ORGANIZER : null,
    },
  });

  res.json({ household: updated });
});

// Rotate invitation link token
router.post('/:householdId/invitation/rotate', requireOwnedHousehold, async (req: Request, res: Response) => {
  const newToken = generateInvitationToken();

  const invitation = await prisma.invitation.upsert({
    where: { householdId: req.params.householdId },
    update: {
      token: newToken,
      status: 'ACTIVE',
      revokedAt: null,
    },
    create: {
      householdId: req.params.householdId,
      token: newToken,
    },
  });

  res.json({ invitation });
});

// Revoke invitation link
router.post('/:householdId/invitation/revoke', requireOwnedHousehold, async (req: Request, res: Response) => {
  const invitation = await prisma.invitation.update({
    where: { householdId: req.params.householdId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
    },
  });

  res.json({ invitation });
});

// Bulk generate links for all households without active tokens
router.post('/invitations/generate-all', async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;

  const households = await prisma.household.findMany({
    where: {
      weddingId,
      OR: [{ invitation: null }, { invitation: { status: 'REVOKED' } }],
    },
    select: { id: true },
  });

  let generatedCount = 0;
  for (const h of households) {
    const token = generateInvitationToken();
    await prisma.invitation.upsert({
      where: { householdId: h.id },
      update: { token, status: 'ACTIVE', revokedAt: null },
      create: { householdId: h.id, token },
    });
    generatedCount++;
  }

  res.json({ success: true, generatedCount });
});

// CSV Import Preview Endpoint
router.post('/import/preview', importExportRateLimiter, async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const { csvContent } = req.body;

  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'CSV content string is required' },
    });
    return;
  }

  // Check file size (max 1 MB)
  if (Buffer.byteLength(csvContent, 'utf8') > CSV_MAX_FILE_SIZE_BYTES) {
    res.status(400).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'CSV file exceeds the 1 MB limit.',
      },
    });
    return;
  }

  // Strip BOM if present
  let cleanCsv = csvContent;
  if (cleanCsv.charCodeAt(0) === 0xfeff) {
    cleanCsv = cleanCsv.slice(1);
  }

  let records: any[];
  try {
    records = parse(cleanCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });
  } catch (err: any) {
    res.status(400).json({
      error: {
        code: 'CSV_PARSE_ERROR',
        message: `Failed to parse CSV: ${err.message || 'Malformed structure'}`,
      },
    });
    return;
  }

  if (records.length > CSV_MAX_ROWS) {
    res.status(400).json({
      error: {
        code: 'TOO_MANY_ROWS',
        message: `CSV contains ${records.length} rows, which exceeds the maximum limit of ${CSV_MAX_ROWS} rows.`,
      },
    });
    return;
  }

  // Fetch existing phones in wedding for duplicate warning detection
  const existingHouseholds = await prisma.household.findMany({
    where: { weddingId },
    select: { id: true, displayName: true, phoneE164: true },
  });
  const phoneMap = new Map<string, { id: string; name: string }>();
  existingHouseholds.forEach((eh) => {
    phoneMap.set(eh.phoneE164, { id: eh.id, name: eh.displayName });
  });

  const rows: any[] = [];
  let validRowCount = 0;
  let invalidRowCount = 0;
  let duplicateWarningCount = 0;

  for (let idx = 0; idx < records.length; idx++) {
    const raw = records[idx];
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header line
    const errors: string[] = [];

    // Header normalization (flexible matching)
    const displayName =
      raw['name'] || raw['Name'] || raw['displayName'] || raw['Guest Name'] || raw['Household'];
    const phone = raw['phone'] || raw['Phone'] || raw['Mobile'] || raw['phoneE164'];
    const email = raw['email'] || raw['Email'] || null;
    const categoryRaw = raw['category'] || raw['Category'] || 'FAMILY';
    const invitedRaw = raw['invited_count'] || raw['invitedCount'] || raw['Seats'] || '1';
    const notes = raw['notes'] || raw['Notes'] || null;

    if (!displayName || displayName.trim().length === 0) {
      errors.push('Name is required');
    }

    let phoneE164: string | undefined;
    if (!phone) {
      errors.push('Phone number is required');
    } else {
      const pRes = normalizePhone(phone);
      if (!pRes.success || !pRes.phoneE164) {
        errors.push(pRes.error || 'Invalid phone format');
      } else {
        phoneE164 = pRes.phoneE164;
      }
    }

    let category = Category.FAMILY;
    const upperCat = String(categoryRaw).toUpperCase().trim();
    if (Object.values(Category).includes(upperCat as Category)) {
      category = upperCat as Category;
    }

    let invitedCount = parseInt(invitedRaw, 10);
    if (isNaN(invitedCount) || invitedCount < 1) {
      invitedCount = 1;
    } else if (invitedCount > 20) {
      errors.push('Invited count cannot exceed 20');
    }

    let duplicateWarning: any = null;
    if (phoneE164 && phoneMap.has(phoneE164)) {
      const match = phoneMap.get(phoneE164)!;
      duplicateWarning = {
        existingHouseholdId: match.id,
        existingHouseholdName: match.name,
      };
      duplicateWarningCount++;
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validRowCount++;
    } else {
      invalidRowCount++;
    }

    rows.push({
      rowNumber,
      displayName: displayName || '',
      phoneRaw: phone || '',
      phoneE164,
      email,
      category,
      invitedCount,
      notes,
      isValid,
      errors,
      duplicateWarning,
    });
  }

  res.json({
    totalRows: records.length,
    validRowCount,
    invalidRowCount,
    duplicateWarningCount,
    rows,
  });
});

// CSV Import Commit Endpoint
router.post('/import/commit', importExportRateLimiter, async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  const { validRows } = req.body;

  if (!Array.isArray(validRows) || validRows.length === 0) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'No valid rows provided for import.' },
    });
    return;
  }

  const weddingEvents = await prisma.event.findMany({
    where: { weddingId },
    select: { id: true },
  });

  // Transactional import
  const importedCount = await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const r of validRows) {
      const phoneRes = normalizePhone(r.phoneRaw || r.phoneE164);
      if (!phoneRes.success || !phoneRes.phoneE164) continue;

      const household = await tx.household.create({
        data: {
          weddingId,
          displayName: r.displayName.trim(),
          phoneE164: phoneRes.phoneE164,
          email: r.email?.toLowerCase().trim() || null,
          category: r.category || Category.FAMILY,
          invitedCount: r.invitedCount || 1,
          notes: r.notes || null,
        },
      });

      // Invitation token
      const token = generateInvitationToken();
      await tx.invitation.create({
        data: {
          householdId: household.id,
          token,
        },
      });

      // Associate to all wedding events
      if (weddingEvents.length > 0) {
        await tx.householdEvent.createMany({
          data: weddingEvents.map((ev) => ({
            householdId: household.id,
            eventId: ev.id,
            invitedCount: household.invitedCount,
          })),
        });
      }

      count++;
    }
    return count;
  });

  res.status(201).json({ success: true, importedCount });
});

// Organizer Record Response on Behalf of Guest
router.post(
  '/:householdId/rsvp',
  requireOwnedHousehold,
  validateBody(householdRsvpSubmissionSchema),
  async (req: Request, res: Response) => {
    const household = req.household!;
    const { events } = req.body;

    // Verify household is invited to each event and attendees count is valid
    const householdEvents = await prisma.householdEvent.findMany({
      where: {
        householdId: household.id,
        eventId: { in: events.map((e: { eventId: string }) => e.eventId) },
      },
    });

    if (householdEvents.length !== events.length) {
      res.status(400).json({
        error: {
          code: 'INVALID_EVENT',
          message: 'The household is not invited to one or more selected events.',
        },
      });
      return;
    }

    for (const submission of events) {
      const he = householdEvents.find((h: { eventId: string; invitedCount: number }) => h.eventId === submission.eventId);
      if (!he) continue;

      if (submission.status === RsvpStatus.ATTENDING) {
        const attendeeCount = submission.attendees.length;
        if (attendeeCount < 1 || attendeeCount > he.invitedCount) {
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

    // Single transaction replace-state
    const result = await prisma.$transaction(async (tx) => {
      for (const submission of events) {
        const existingResponse = await tx.rsvpResponse.findUnique({
          where: {
            householdId_eventId: {
              householdId: household.id,
              eventId: submission.eventId,
            },
          },
        });

        const newVersion = (existingResponse?.version || 0) + 1;

        // Upsert RsvpResponse
        const response = await tx.rsvpResponse.upsert({
          where: {
            householdId_eventId: {
              householdId: household.id,
              eventId: submission.eventId,
            },
          },
          update: {
            status: submission.status,
            arrivalWindow: submission.arrivalWindow || null,
            message: submission.message || null,
            extraSeatsRequested: submission.extraSeatsRequested || null,
            source: RsvpSource.ORGANIZER_ENTRY,
            version: newVersion,
            respondedAt: new Date(),
          },
          create: {
            householdId: household.id,
            eventId: submission.eventId,
            status: submission.status,
            arrivalWindow: submission.arrivalWindow || null,
            message: submission.message || null,
            extraSeatsRequested: submission.extraSeatsRequested || null,
            source: RsvpSource.ORGANIZER_ENTRY,
            version: newVersion,
          },
        });

        // Delete previous attendees and recreate if attending
        await tx.attendee.deleteMany({
          where: { rsvpResponseId: response.id },
        });

        if (submission.status === RsvpStatus.ATTENDING) {
          await tx.attendee.createMany({
            data: submission.attendees.map((a: any, idx: number) => ({
              rsvpResponseId: response.id,
              position: idx + 1,
              name: a.name?.trim() || `Guest ${idx + 1}`,
              dietary: a.dietary,
              dietaryNote: a.dietaryNote?.trim() || null,
            })),
          });
        }

        // Write append-only revision
        const confirmedCount =
          submission.status === RsvpStatus.ATTENDING ? submission.attendees.length : 0;
        await tx.rsvpRevision.create({
          data: {
            householdId: household.id,
            eventId: submission.eventId,
            status: submission.status,
            confirmedCount,
            dietarySnapshot: submission.attendees as any,
            source: RsvpSource.ORGANIZER_ENTRY,
          },
        });
      }

      // Automatically clear follow-up flag upon response
      await tx.household.update({
        where: { id: household.id },
        data: { followUpFlag: false },
      });

      return { success: true };
    });

    res.json(result);
  }
);

// CSV Export: Guest List for Selected Event
router.get('/export/guest-list', importExportRateLimiter, async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  let eventId = req.query.eventId as string;

  if (!eventId) {
    const defaultEvent = await prisma.event.findFirst({
      where: { weddingId },
      orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
    });
    if (!defaultEvent) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No events found for wedding.' } });
      return;
    }
    eventId = defaultEvent.id;
  }

  const eventItem = await prisma.event.findFirst({
    where: { id: eventId, weddingId },
  });

  if (!eventItem) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
    return;
  }

  const households = await prisma.household.findMany({
    where: {
      weddingId,
      events: { some: { eventId } },
    },
    include: {
      invitation: true,
      events: {
        where: { eventId },
        include: {
          rsvpResponse: {
            include: { attendees: true },
          },
        },
      },
      messageLogs: {
        where: { status: 'MARKED_SENT' },
        orderBy: { markedSentAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { displayName: 'asc' },
  });

  const headers = [
    'Household Name',
    'Phone',
    'Category',
    'Invited Count',
    'Confirmed Count',
    'Status',
    'Dietary Breakdown',
    'Arrival Window',
    'Last Contacted',
    'Guest Message',
    'Extra Seats Requested',
  ];

  const rows = households.map((h) => {
    const he = h.events[0];
    const res = he?.rsvpResponse;
    const confirmed = res?.status === RsvpStatus.ATTENDING ? res.attendees.length : 0;
    const status = res
      ? res.status === RsvpStatus.ATTENDING
        ? `Attending (${confirmed}/${he.invitedCount})`
        : 'Declined'
      : 'Awaiting';

    const dietaryCounts: Record<string, number> = {};
    if (res?.status === RsvpStatus.ATTENDING) {
      res.attendees.forEach((a) => {
        dietaryCounts[a.dietary] = (dietaryCounts[a.dietary] || 0) + 1;
      });
    }
    const dietarySummary = Object.entries(dietaryCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');

    const lastContacted = h.messageLogs[0]?.markedSentAt
      ? h.messageLogs[0].markedSentAt.toISOString().slice(0, 10)
      : 'Never';

    return [
      h.displayName,
      h.phoneE164,
      h.category,
      he?.invitedCount || h.invitedCount,
      confirmed,
      status,
      dietarySummary || 'N/A',
      res?.arrivalWindow || 'N/A',
      lastContacted,
      res?.message || '',
      res?.extraSeatsRequested || 0,
    ];
  });

  const csv = generateCsv(headers, rows, true);
  const filename = `guest_list_${eventItem.name.replace(/\s+/g, '_')}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// CSV Export: Catering Summary
router.get('/export/catering-summary', importExportRateLimiter, async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  let eventId = req.query.eventId as string;

  if (!eventId) {
    const defaultEvent = await prisma.event.findFirst({
      where: { weddingId },
      orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
    });
    if (!defaultEvent) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No events found for wedding.' } });
      return;
    }
    eventId = defaultEvent.id;
  }

  const eventItem = await prisma.event.findFirst({
    where: { id: eventId, weddingId },
    include: { wedding: true },
  });

  if (!eventItem) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
    return;
  }

  const attendees = await prisma.attendee.findMany({
    where: {
      rsvpResponse: {
        eventId,
        status: RsvpStatus.ATTENDING,
      },
    },
  });

  const responses = await prisma.rsvpResponse.findMany({
    where: { eventId },
  });

  const householdEvents = await prisma.householdEvent.findMany({
    where: { eventId },
  });

  const totalInvited = householdEvents.reduce((acc, h) => acc + h.invitedCount, 0);
  const totalConfirmed = attendees.length;
  const declinedCount = responses
    .filter((r) => r.status === RsvpStatus.NOT_ATTENDING)
    .reduce((acc, r) => {
      const he = householdEvents.find((h) => h.householdId === r.householdId);
      return acc + (he?.invitedCount || 0);
    }, 0);
  const awaitingCount = totalInvited - totalConfirmed - declinedCount;

  const dietaryCounts: Record<string, number> = {
    [Dietary.VEGETARIAN]: 0,
    [Dietary.NON_VEGETARIAN]: 0,
    [Dietary.JAIN]: 0,
    [Dietary.VEGAN]: 0,
    [Dietary.EGGETARIAN]: 0,
    [Dietary.NO_PREFERENCE]: 0,
  };
  attendees.forEach((a) => {
    dietaryCounts[a.dietary] = (dietaryCounts[a.dietary] || 0) + 1;
  });

  const headers = ['Metric / Section', 'Value', 'Notes'];
  const rows = [
    ['REPORT', 'CATERING SUMMARY', ''],
    ['Event Name', eventItem.name, ''],
    ['Generated At', new Date().toISOString(), 'Asia/Kolkata timezone standard'],
    ['CRITICAL NOTICE', 'Note: Pending guests are NOT included in confirmed headcount. Pending guests are NOT included in confirmed figures.', ''],
    ['Total Invited People', totalInvited, 'Headcount cap'],
    ['Confirmed Attendance (Certain)', totalConfirmed, 'Actual confirmed heads'],
    ['Declined Attendance', declinedCount, 'Explicit declines'],
    ['Awaiting / Pending', awaitingCount, 'Unconfirmed'],
    ['--- DIETARY BREAKDOWN ---', '---', '---'],
    ['Vegetarian', dietaryCounts[Dietary.VEGETARIAN], ''],
    ['Non-Vegetarian', dietaryCounts[Dietary.NON_VEGETARIAN], ''],
    ['Jain', dietaryCounts[Dietary.JAIN], 'No root vegetables'],
    ['Vegan', dietaryCounts[Dietary.VEGAN], ''],
    ['Eggetarian', dietaryCounts[Dietary.EGGETARIAN], ''],
    ['No Preference', dietaryCounts[Dietary.NO_PREFERENCE], ''],
  ];

  const csv = generateCsv(headers, rows, true);
  const filename = `catering_summary_${eventItem.name.replace(/\s+/g, '_')}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// CSV Export: Detailed Attendee Level List
router.get('/export/attendees', importExportRateLimiter, async (req: Request, res: Response) => {
  const weddingId = req.params.weddingId;
  let eventId = req.query.eventId as string;

  if (!eventId) {
    const defaultEvent = await prisma.event.findFirst({
      where: { weddingId },
      orderBy: [{ sortOrder: 'asc' }, { startsAt: 'asc' }],
    });
    if (!defaultEvent) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No events found for wedding.' } });
      return;
    }
    eventId = defaultEvent.id;
  }

  const attendees = await prisma.attendee.findMany({
    where: {
      rsvpResponse: {
        eventId,
        status: RsvpStatus.ATTENDING,
        household: { weddingId },
      },
    },
    include: {
      rsvpResponse: {
        include: {
          household: true,
          event: true,
        },
      },
    },
    orderBy: [
      { rsvpResponse: { household: { displayName: 'asc' } } },
      { position: 'asc' },
    ],
  });

  const headers = ['Household', 'Attendee Name', 'Dietary Preference', 'Special Notes', 'Event'];
  const rows = attendees.map((a) => [
    a.rsvpResponse.household.displayName,
    a.name || `Guest ${a.position}`,
    a.dietary,
    a.dietaryNote || '',
    a.rsvpResponse.event.name,
  ]);

  const csv = generateCsv(headers, rows, true);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="attendees_list.csv"');
  res.send(csv);
});

export default router;
