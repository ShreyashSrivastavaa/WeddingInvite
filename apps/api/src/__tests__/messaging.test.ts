import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, clearTestDatabase, createTestUser } from './test-helpers';
import { prisma } from '../db/prisma';
import { MessageKind, MessageStatus } from '@rsvp/shared';

describe('WhatsApp Click-to-Chat & Honest Statuses', () => {
  let organizer: any;
  let wedding: any;
  let event: any;
  let household: any;

  beforeEach(async () => {
    await clearTestDatabase();
    organizer = await createTestUser();

    wedding = await prisma.wedding.create({
      data: {
        ownerId: organizer.user.id,
        title: 'Rohit & Natasha Wedding',
        partnerOneName: 'Rohit',
        partnerTwoName: 'Natasha',
        rsvpDeadline: new Date('2027-06-01T18:00:00Z'),
        dietaryOptions: ['VEGETARIAN', 'NON_VEGETARIAN'],
      },
    });

    event = await prisma.event.create({
      data: {
        weddingId: wedding.id,
        name: 'Sangeet Night',
        startsAt: new Date('2027-06-15T19:00:00Z'),
        venueName: 'ITC Grand Chola',
        venueAddress: 'Chennai',
      },
    });

    household = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Iyer Family',
        phoneE164: '+919876543210',
        invitedCount: 3,
      },
    });

    await prisma.householdEvent.create({
      data: { householdId: household.id, eventId: event.id, invitedCount: 3 },
    });

    await prisma.invitation.create({
      data: { householdId: household.id, token: 'iyer-token-123' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('generates queue items with wa.me URLs and excludes opted-out guests', async () => {
    // Add opted-out guest
    const optOutH = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Opted Out Guest',
        phoneE164: '+919876543299',
        doNotContact: true,
      },
    });
    await prisma.invitation.create({
      data: { householdId: optOutH.id, token: 'opt-out-token' },
    });

    const res = await request(app)
      .get(`/api/weddings/${wedding.id}/messages/queue?kind=INVITATION`)
      .set('Cookie', organizer.sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.totalEligible).toBe(1);
    expect(res.body.items[0].displayName).toBe('Iyer Family');
    expect(res.body.items[0].whatsAppUrl).toContain('https://wa.me/919876543210?text=');
    expect(res.body.items[0].renderedText).toContain('Rohit & Natasha');
    expect(res.body.items[0].renderedText).toContain('iyer-token-123');

    // Opted out guest is in excluded list
    expect(res.body.excluded).toHaveLength(1);
    expect(res.body.excluded[0].displayName).toBe('Opted Out Guest');
  });

  it('tracks honest status flow: PREPARED -> MARKED_SENT ("Marked as sent by you")', async () => {
    // 1. Prepare message
    const prepRes = await request(app)
      .post(`/api/weddings/${wedding.id}/messages/prepare`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        householdId: household.id,
        kind: MessageKind.INVITATION,
        templateKey: 'INVITATION',
        body: 'Hello Iyer Family, please join us!',
      });

    expect(prepRes.status).toBe(201);
    expect(prepRes.body.status).toBe('PREPARED');
    expect(prepRes.body.whatsAppUrl).toBeDefined();
    const logId = prepRes.body.messageLogId;

    // Verify DB state is PREPARED
    const logDb = await prisma.messageLog.findUnique({ where: { id: logId } });
    expect(logDb?.status).toBe(MessageStatus.PREPARED);

    // 2. Mark sent
    const markRes = await request(app)
      .post(`/api/weddings/${wedding.id}/messages/mark-sent`)
      .set('Cookie', organizer.sessionCookie)
      .send({ messageLogId: logId });

    expect(markRes.status).toBe(200);
    expect(markRes.body.messageLog.status).toBe('MARKED_SENT');
    expect(markRes.body.statusDisplay).toBe('Marked as sent by you');

    // Verify click-to-chat cannot create false DELIVERED state
    expect(markRes.body.messageLog.status).not.toBe('DELIVERED');
  });
});
