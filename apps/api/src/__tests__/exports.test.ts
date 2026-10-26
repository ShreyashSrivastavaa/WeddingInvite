import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, clearTestDatabase, createTestUser } from './test-helpers';
import { prisma } from '../db/prisma';
import { Dietary, RsvpStatus } from '@rsvp/shared';

describe('CSV Exports and Formula Injection Safety', () => {
  let organizer: any;
  let wedding: any;
  let event: any;

  beforeEach(async () => {
    await clearTestDatabase();
    organizer = await createTestUser();

    wedding = await prisma.wedding.create({
      data: {
        ownerId: organizer.user.id,
        title: 'Kunal & Riya Wedding',
        partnerOneName: 'Kunal',
        partnerTwoName: 'Riya',
        rsvpDeadline: new Date('2027-07-01T18:00:00Z'),
        dietaryOptions: ['VEGETARIAN', 'NON_VEGETARIAN'],
      },
    });

    event = await prisma.event.create({
      data: {
        weddingId: wedding.id,
        name: 'Wedding Reception',
        startsAt: new Date('2027-07-15T18:00:00Z'),
        venueName: 'Taj Bengal',
        venueAddress: 'Kolkata',
      },
    });

    // Household with formula in notes/message
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Formula Test Household',
        phoneE164: '+919876543210',
        invitedCount: 2,
      },
    });

    await prisma.householdEvent.create({
      data: { householdId: h.id, eventId: event.id, invitedCount: 2 },
    });

    const resp = await prisma.rsvpResponse.create({
      data: {
        householdId: h.id,
        eventId: event.id,
        status: RsvpStatus.ATTENDING,
        message: '=2+2', // Formula injection attempt
      },
    });

    await prisma.attendee.create({
      data: {
        rsvpResponseId: resp.id,
        position: 1,
        name: '+cmd|calc', // Formula injection attempt in name
        dietary: Dietary.VEGETARIAN,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('exports guest list with UTF-8 BOM and formula sanitization', async () => {
    const res = await request(app)
      .get(`/api/weddings/${wedding.id}/households/export/guest-list?eventId=${event.id}`)
      .set('Cookie', organizer.sessionCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const text = res.text;

    // Checks UTF-8 BOM
    expect(text.charCodeAt(0)).toBe(0xfeff);

    // Checks formula injection escaping: `=2+2` should be `"'=2+2"`
    expect(text).toContain(`"'=2+2"`);
    expect(text).not.toContain(`"=2+2"`);
  });

  it('exports catering summary with prominent non-forecast disclaimer', async () => {
    const res = await request(app)
      .get(`/api/weddings/${wedding.id}/households/export/catering-summary?eventId=${event.id}`)
      .set('Cookie', organizer.sessionCookie);

    expect(res.status).toBe(200);
    const text = res.text;

    // Checks prominent notice
    expect(text).toContain('Pending guests are NOT included in confirmed figures');
    expect(text).toContain('Confirmed Attendance (Certain)');
    expect(text).toContain('Awaiting / Pending');
  });

  it('exports attendee-level dietary list with safe escaping', async () => {
    const res = await request(app)
      .get(`/api/weddings/${wedding.id}/households/export/attendees?eventId=${event.id}`)
      .set('Cookie', organizer.sessionCookie);

    expect(res.status).toBe(200);
    const text = res.text;

    // Checks formula escaping on attendee name
    expect(text).toContain(`"'+cmd|calc"`);
  });
});
