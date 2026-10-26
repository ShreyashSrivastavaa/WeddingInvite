import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, clearTestDatabase, createTestUser } from './test-helpers';
import { prisma } from '../db/prisma';
import { Dietary, RsvpStatus } from '@rsvp/shared';

describe('RSVP Engine & Required Business Scenarios', () => {
  let organizer: any;
  let wedding: any;
  let event: any;

  beforeEach(async () => {
    await clearTestDatabase();
    organizer = await createTestUser();

    wedding = await prisma.wedding.create({
      data: {
        ownerId: organizer.user.id,
        title: 'Anand & Meera Wedding',
        partnerOneName: 'Anand',
        partnerTwoName: 'Meera',
        rsvpDeadline: new Date('2027-05-01T18:00:00Z'),
        dietaryOptions: ['VEGETARIAN', 'NON_VEGETARIAN', 'JAIN', 'VEGAN'],
        allowChangesAfterDeadline: true,
      },
    });

    event = await prisma.event.create({
      data: {
        weddingId: wedding.id,
        name: 'Wedding Ceremony & Banquet',
        startsAt: new Date('2027-05-15T18:00:00Z'),
        venueName: 'Taj Falaknuma Palace',
        venueAddress: 'Hyderabad',
        cateringTarget: 350,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Scenario 1: 400 invited / 280 confirmed / 30 declined / 90 awaiting
  it('Scenario 1: 400 invited / 280 confirmed / 30 declined / 90 awaiting dashboard accuracy', async () => {
    // 70 households of 4 = 280 confirmed
    // 10 households of 3 = 30 declined
    // 30 households of 3 = 90 awaiting
    const totalHouseholdsToCreate = 70 + 10 + 30; // 110 households

    // Batch create households and householdEvents
    for (let i = 0; i < 70; i++) {
      const h = await prisma.household.create({
        data: {
          weddingId: wedding.id,
          displayName: `Attending Family ${i}`,
          phoneE164: `+9198000${String(i).padStart(5, '0')}`,
          invitedCount: 4,
        },
      });
      await prisma.householdEvent.create({
        data: { householdId: h.id, eventId: event.id, invitedCount: 4 },
      });
      const resp = await prisma.rsvpResponse.create({
        data: {
          householdId: h.id,
          eventId: event.id,
          status: RsvpStatus.ATTENDING,
        },
      });
      await prisma.attendee.createMany({
        data: Array.from({ length: 4 }, (_, idx) => ({
          rsvpResponseId: resp.id,
          position: idx + 1,
          name: `Guest ${idx + 1}`,
          dietary: Dietary.VEGETARIAN,
        })),
      });
    }

    for (let i = 0; i < 10; i++) {
      const h = await prisma.household.create({
        data: {
          weddingId: wedding.id,
          displayName: `Declined Family ${i}`,
          phoneE164: `+9198100${String(i).padStart(5, '0')}`,
          invitedCount: 3,
        },
      });
      await prisma.householdEvent.create({
        data: { householdId: h.id, eventId: event.id, invitedCount: 3 },
      });
      await prisma.rsvpResponse.create({
        data: {
          householdId: h.id,
          eventId: event.id,
          status: RsvpStatus.NOT_ATTENDING,
        },
      });
    }

    for (let i = 0; i < 30; i++) {
      const h = await prisma.household.create({
        data: {
          weddingId: wedding.id,
          displayName: `Awaiting Family ${i}`,
          phoneE164: `+9198200${String(i).padStart(5, '0')}`,
          invitedCount: 3,
        },
      });
      await prisma.householdEvent.create({
        data: { householdId: h.id, eventId: event.id, invitedCount: 3 },
      });
    }

    // Call dashboard endpoint
    const res = await request(app)
      .get(`/api/weddings/${wedding.id}/dashboard?eventId=${event.id}`)
      .set('Cookie', organizer.sessionCookie);

    expect(res.status).toBe(200);
    const summary = res.body.summary;

    expect(summary.invited).toBe(400);
    expect(summary.confirmed).toBe(280);
    expect(summary.declined).toBe(30);
    expect(summary.awaiting).toBe(90);

    // Invariant check
    expect(summary.confirmed + summary.declined + summary.awaiting).toBe(summary.invited);
    expect(summary.isInvariantValid).toBe(true);

    // Pending is NOT counted as confirmed
    expect(summary.cateringBounds.minCertain).toBe(280);
    expect(summary.cateringBounds.maxPossible).toBe(370);
  });

  // Scenario 2: Household of 4 confirms 3 -> confirmed = +3, declined = 1
  it('Scenario 2: Household invited for 4 confirms 3', async () => {
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Deshmukh Family',
        phoneE164: '+919988776655',
        invitedCount: 4,
      },
    });
    await prisma.householdEvent.create({
      data: { householdId: h.id, eventId: event.id, invitedCount: 4 },
    });
    const inv = await prisma.invitation.create({
      data: { householdId: h.id, token: 'test-token-scenario-2' },
    });

    const submitRes = await request(app)
      .post(`/api/rsvp/${inv.token}/submit`)
      .send({
        events: [
          {
            eventId: event.id,
            status: RsvpStatus.ATTENDING,
            arrivalWindow: 'ON_TIME',
            attendees: [
              { name: 'Sanjay Deshmukh', dietary: Dietary.VEGETARIAN },
              { name: 'Sunita Deshmukh', dietary: Dietary.JAIN },
              { name: 'Aarav Deshmukh', dietary: Dietary.VEGETARIAN },
            ],
          },
        ],
      });

    expect(submitRes.status).toBe(200);

    // Check dashboard counts
    const dashRes = await request(app)
      .get(`/api/weddings/${wedding.id}/dashboard?eventId=${event.id}`)
      .set('Cookie', organizer.sessionCookie);

    const summary = dashRes.body.summary;
    expect(summary.invited).toBe(4);
    expect(summary.confirmed).toBe(3);
    expect(summary.declined).toBe(1); // 4 - 3 = 1
    expect(summary.awaiting).toBe(0);
    expect(summary.isInvariantValid).toBe(true);
    expect(summary.dietaryTotals.VEGETARIAN).toBe(2);
    expect(summary.dietaryTotals.JAIN).toBe(1);
  });

  // Scenario 3: Household later updates 3 -> 2 -> confirmed decreases by 1, revisions logged, idempotent
  it('Scenario 3: Household updates 3 -> 2 confirmed, revisions logged, resubmission is idempotent', async () => {
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Bansal Family',
        phoneE164: '+919911223344',
        invitedCount: 4,
      },
    });
    await prisma.householdEvent.create({
      data: { householdId: h.id, eventId: event.id, invitedCount: 4 },
    });
    const inv = await prisma.invitation.create({
      data: { householdId: h.id, token: 'test-token-scenario-3' },
    });

    // 1. Initial submit 3 confirmed
    await request(app)
      .post(`/api/rsvp/${inv.token}/submit`)
      .send({
        events: [
          {
            eventId: event.id,
            status: RsvpStatus.ATTENDING,
            attendees: [
              { name: 'Guest 1', dietary: Dietary.VEGETARIAN },
              { name: 'Guest 2', dietary: Dietary.VEGETARIAN },
              { name: 'Guest 3', dietary: Dietary.VEGAN },
            ],
          },
        ],
      });

    // 2. Update to 2 confirmed
    const updateRes = await request(app)
      .post(`/api/rsvp/${inv.token}/submit`)
      .send({
        events: [
          {
            eventId: event.id,
            status: RsvpStatus.ATTENDING,
            attendees: [
              { name: 'Guest 1', dietary: Dietary.VEGETARIAN },
              { name: 'Guest 2', dietary: Dietary.VEGAN },
            ],
          },
        ],
      });
    expect(updateRes.status).toBe(200);

    // Verify dashboard reflects 2 confirmed, 2 declined
    const dashRes = await request(app)
      .get(`/api/weddings/${wedding.id}/dashboard?eventId=${event.id}`)
      .set('Cookie', organizer.sessionCookie);

    expect(dashRes.body.summary.confirmed).toBe(2);
    expect(dashRes.body.summary.declined).toBe(2);
    expect(dashRes.body.summary.dietaryTotals.VEGETARIAN).toBe(1);
    expect(dashRes.body.summary.dietaryTotals.VEGAN).toBe(1);

    // Verify revisions exist
    const revisions = await prisma.rsvpRevision.findMany({
      where: { householdId: h.id, eventId: event.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(revisions).toHaveLength(2);
    expect(revisions[0].confirmedCount).toBe(3);
    expect(revisions[1].confirmedCount).toBe(2);

    // 3. Repeated identical submit does not inflate counts
    await request(app)
      .post(`/api/rsvp/${inv.token}/submit`)
      .send({
        events: [
          {
            eventId: event.id,
            status: RsvpStatus.ATTENDING,
            attendees: [
              { name: 'Guest 1', dietary: Dietary.VEGETARIAN },
              { name: 'Guest 2', dietary: Dietary.VEGAN },
            ],
          },
        ],
      });

    const dashRes2 = await request(app)
      .get(`/api/weddings/${wedding.id}/dashboard?eventId=${event.id}`)
      .set('Cookie', organizer.sessionCookie);
    expect(dashRes2.body.summary.confirmed).toBe(2);
    expect(dashRes2.body.summary.declined).toBe(2);
  });

  // Scenario 4: Concurrent double-submit resolves without duplication
  it('Scenario 4: Concurrent double-submit yields consistent state without duplicate attendees', async () => {
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Chatterjee Family',
        phoneE164: '+919933445566',
        invitedCount: 3,
      },
    });
    await prisma.householdEvent.create({
      data: { householdId: h.id, eventId: event.id, invitedCount: 3 },
    });
    const inv = await prisma.invitation.create({
      data: { householdId: h.id, token: 'test-token-scenario-4' },
    });

    const payload = {
      events: [
        {
          eventId: event.id,
          status: RsvpStatus.ATTENDING,
          attendees: [
            { name: 'Pooja', dietary: Dietary.NON_VEGETARIAN },
            { name: 'Ravi', dietary: Dietary.NON_VEGETARIAN },
          ],
        },
      ],
    };

    // Parallel requests
    const [res1, res2] = await Promise.all([
      request(app).post(`/api/rsvp/${inv.token}/submit`).send(payload),
      request(app).post(`/api/rsvp/${inv.token}/submit`).send(payload),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Verify attendee count in database is exactly 2, NOT 4
    const attendees = await prisma.attendee.findMany({
      where: {
        rsvpResponse: {
          householdId: h.id,
          eventId: event.id,
        },
      },
    });
    expect(attendees).toHaveLength(2);
  });

  // Scenario 5: Invalid, revoked, and expired tokens return safe error without revealing data
  it('Scenario 5: Invalid, revoked, and expired tokens show safe 404 and never leak data', async () => {
    // 1. Non-existent token
    const nonExistentRes = await request(app).get('/api/rsvp/non-existent-token-xyz');
    expect(nonExistentRes.status).toBe(404);
    expect(nonExistentRes.body.error.message).toBe("This invitation link isn't active. Please contact the family.");
    expect(nonExistentRes.headers['x-robots-tag']).toBe('noindex, nofollow');

    // 2. Revoked token
    const hRevoked = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Secret Household',
        phoneE164: '+919900011122',
        invitedCount: 2,
      },
    });
    const invRevoked = await prisma.invitation.create({
      data: {
        householdId: hRevoked.id,
        token: 'revoked-token-123',
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    const revokedRes = await request(app).get(`/api/rsvp/${invRevoked.token}`);
    expect(revokedRes.status).toBe(404);
    expect(revokedRes.body.error.message).toBe("This invitation link isn't active. Please contact the family.");
    expect(revokedRes.body.displayName).toBeUndefined(); // Never leaked

    // 3. Expired token
    const hExpired = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Expired Household',
        phoneE164: '+919900033344',
        invitedCount: 2,
      },
    });
    const invExpired = await prisma.invitation.create({
      data: {
        householdId: hExpired.id,
        token: 'expired-token-123',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    });

    const expiredRes = await request(app).get(`/api/rsvp/${invExpired.token}`);
    expect(expiredRes.status).toBe(404);
    expect(expiredRes.body.displayName).toBeUndefined();
  });

  it('rejects stale version with 409 conflict', async () => {
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Version Test Household',
        phoneE164: '+919876543299',
        invitedCount: 2,
      },
    });
    await prisma.householdEvent.create({
      data: { householdId: h.id, eventId: event.id, invitedCount: 2 },
    });
    const inv = await prisma.invitation.create({
      data: { householdId: h.id, token: 'version-test-token' },
    });

    // Device 1 submits version 1
    await request(app)
      .post(`/api/rsvp/${inv.token}/submit`)
      .send({
        events: [{ eventId: event.id, status: RsvpStatus.ATTENDING, attendees: [{ dietary: Dietary.VEGETARIAN }] }],
      });

    // Device 2 submits with stale expectedVersion: 0
    const conflictRes = await request(app)
      .post(`/api/rsvp/${inv.token}/submit`)
      .send({
        expectedVersion: 0,
        events: [{ eventId: event.id, status: RsvpStatus.NOT_ATTENDING, attendees: [] }],
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe('VERSION_CONFLICT');
  });

  it('allows organizer to record response on behalf of guest', async () => {
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: 'Elder Uncle Family',
        phoneE164: '+919876543288',
        invitedCount: 2,
        followUpFlag: true,
      },
    });
    await prisma.householdEvent.create({
      data: { householdId: h.id, eventId: event.id, invitedCount: 2 },
    });

    const res = await request(app)
      .post(`/api/weddings/${wedding.id}/households/${h.id}/rsvp`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        events: [
          {
            eventId: event.id,
            status: RsvpStatus.ATTENDING,
            arrivalWindow: 'ON_TIME',
            attendees: [
              { name: 'Chachaji', dietary: Dietary.VEGETARIAN },
              { name: 'Chachiji', dietary: Dietary.JAIN },
            ],
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Follow-up flag should be automatically cleared upon response
    const updatedH = await prisma.household.findUnique({ where: { id: h.id } });
    expect(updatedH?.followUpFlag).toBe(false);

    // Source recorded as ORGANIZER_ENTRY
    const rsvp = await prisma.rsvpResponse.findUnique({
      where: { householdId_eventId: { householdId: h.id, eventId: event.id } },
    });
    expect(rsvp?.source).toBe('ORGANIZER_ENTRY');
  });
});
