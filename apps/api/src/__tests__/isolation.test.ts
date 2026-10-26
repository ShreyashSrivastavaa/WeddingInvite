import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, clearTestDatabase, createTestUser } from './test-helpers';
import { prisma } from '../db/prisma';

describe('Cross-Organizer Ownership Isolation', () => {
  let organizerA: any;
  let organizerB: any;
  let weddingA: any;
  let eventA: any;
  let householdA: any;

  beforeEach(async () => {
    await clearTestDatabase();

    organizerA = await createTestUser('organizerA@test.com');
    organizerB = await createTestUser('organizerB@test.com');

    // Create resources for Organizer A
    weddingA = await prisma.wedding.create({
      data: {
        ownerId: organizerA.user.id,
        title: 'Aarav & Ishita Wedding',
        partnerOneName: 'Aarav',
        partnerTwoName: 'Ishita',
        rsvpDeadline: new Date('2027-02-01T10:00:00Z'),
        dietaryOptions: ['VEGETARIAN', 'NON_VEGETARIAN'],
      },
    });

    eventA = await prisma.event.create({
      data: {
        weddingId: weddingA.id,
        name: 'Sangeet Ceremony',
        startsAt: new Date('2027-02-14T18:00:00Z'),
        venueName: 'The Leela Palace',
        venueAddress: 'Udaipur, Rajasthan',
      },
    });

    householdA = await prisma.household.create({
      data: {
        weddingId: weddingA.id,
        displayName: 'Kapoor Family',
        phoneE164: '+919876543210',
        invitedCount: 4,
      },
    });

    await prisma.householdEvent.create({
      data: {
        householdId: householdA.id,
        eventId: eventA.id,
        invitedCount: 4,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('asserts Organizer B receives strict 404 for every protected route using Organizer A IDs', async () => {
    const bCookie = organizerB.sessionCookie;

    const routesToTest = [
      // Wedding CRUD
      { method: 'get', url: `/api/weddings/${weddingA.id}` },
      { method: 'patch', url: `/api/weddings/${weddingA.id}`, body: { title: 'Hacked' } },
      { method: 'delete', url: `/api/weddings/${weddingA.id}?confirmTitle=${encodeURIComponent(weddingA.title)}` },
      { method: 'get', url: `/api/weddings/${weddingA.id}/templates` },

      // Event CRUD
      { method: 'get', url: `/api/weddings/${weddingA.id}/events` },
      {
        method: 'post',
        url: `/api/weddings/${weddingA.id}/events`,
        body: {
          name: 'Intruder Event',
          startsAt: '2027-02-15T18:00:00Z',
          venueName: 'Venue',
          venueAddress: 'Address',
        },
      },
      { method: 'get', url: `/api/weddings/${weddingA.id}/events/${eventA.id}` },
      { method: 'patch', url: `/api/weddings/${weddingA.id}/events/${eventA.id}`, body: { name: 'Hacked' } },
      { method: 'delete', url: `/api/weddings/${weddingA.id}/events/${eventA.id}` },

      // Household CRUD & drawer
      { method: 'get', url: `/api/weddings/${weddingA.id}/households` },
      {
        method: 'post',
        url: `/api/weddings/${weddingA.id}/households`,
        body: {
          displayName: 'Intruder Guest',
          phone: '+919888877777',
          invitedCount: 2,
        },
      },
      { method: 'get', url: `/api/weddings/${weddingA.id}/households/${householdA.id}` },
      { method: 'patch', url: `/api/weddings/${weddingA.id}/households/${householdA.id}`, body: { displayName: 'Hacked' } },
      { method: 'delete', url: `/api/weddings/${weddingA.id}/households/${householdA.id}` },
      { method: 'patch', url: `/api/weddings/${weddingA.id}/households/${householdA.id}/follow-up` },
      { method: 'patch', url: `/api/weddings/${weddingA.id}/households/${householdA.id}/opt-out` },
      { method: 'post', url: `/api/weddings/${weddingA.id}/households/${householdA.id}/invitation/rotate` },
      { method: 'post', url: `/api/weddings/${weddingA.id}/households/${householdA.id}/invitation/revoke` },

      // Dashboard & Messaging & Exports
      { method: 'get', url: `/api/weddings/${weddingA.id}/dashboard?eventId=${eventA.id}` },
      { method: 'get', url: `/api/weddings/${weddingA.id}/messages/queue` },
      { method: 'get', url: `/api/weddings/${weddingA.id}/messages/history` },
      { method: 'get', url: `/api/weddings/${weddingA.id}/households/export/guest-list?eventId=${eventA.id}` },
      { method: 'get', url: `/api/weddings/${weddingA.id}/households/export/catering-summary?eventId=${eventA.id}` },
    ];

    for (const route of routesToTest) {
      let req = (request(app) as any)[route.method](route.url).set('Cookie', bCookie);
      if (route.body) {
        req = req.send(route.body);
      }
      const res = await req;
      expect(
        res.status,
        `Expected 404 for Organizer B accessing ${route.method.toUpperCase()} ${route.url}, got ${res.status}`
      ).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
  });
});
