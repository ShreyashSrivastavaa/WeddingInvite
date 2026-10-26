import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, clearTestDatabase, createTestUser } from './test-helpers';
import { prisma } from '../db/prisma';

describe('Weddings and Events Management', () => {
  let organizer: any;

  beforeEach(async () => {
    await clearTestDatabase();
    organizer = await createTestUser();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and updates a wedding with validation', async () => {
    const res = await request(app)
      .post('/api/weddings')
      .set('Cookie', organizer.sessionCookie)
      .send({
        title: 'Vikram & Priya Wedding',
        partnerOneName: 'Vikram',
        partnerTwoName: 'Priya',
        rsvpDeadline: '2027-03-01T18:00:00Z',
        dietaryOptions: ['VEGETARIAN', 'JAIN'],
        theme: 'ROYAL_IVORY_MAROON',
        cateringTarget: 250,
      });

    expect(res.status).toBe(201);
    expect(res.body.wedding.id).toBeDefined();
    expect(res.body.wedding.title).toBe('Vikram & Priya Wedding');
    const weddingId = res.body.wedding.id;

    // Update wedding
    const patchRes = await request(app)
      .patch(`/api/weddings/${weddingId}`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        cateringTarget: 300,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.wedding.cateringTarget).toBe(300);
  });

  it('requires typed confirmation to delete a wedding', async () => {
    const createRes = await request(app)
      .post('/api/weddings')
      .set('Cookie', organizer.sessionCookie)
      .send({
        title: 'Delete Me Wedding',
        partnerOneName: 'Partner A',
        rsvpDeadline: '2027-03-01T18:00:00Z',
      });
    const weddingId = createRes.body.wedding.id;

    // Incorrect confirmation title
    const failRes = await request(app)
      .delete(`/api/weddings/${weddingId}?confirmTitle=WrongTitle`)
      .set('Cookie', organizer.sessionCookie);
    expect(failRes.status).toBe(400);
    expect(failRes.body.error.code).toBe('CONFIRMATION_MISMATCH');

    // Correct confirmation title
    const successRes = await request(app)
      .delete(`/api/weddings/${weddingId}?confirmTitle=${encodeURIComponent('Delete Me Wedding')}`)
      .set('Cookie', organizer.sessionCookie);
    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
  });

  it('creates events for a wedding and validates end time is after start time', async () => {
    const createWeddingRes = await request(app)
      .post('/api/weddings')
      .set('Cookie', organizer.sessionCookie)
      .send({
        title: 'Rohan & Ananya',
        partnerOneName: 'Rohan',
        rsvpDeadline: '2027-03-01T18:00:00Z',
      });
    const weddingId = createWeddingRes.body.wedding.id;

    // End time before start time should fail
    const invalidEventRes = await request(app)
      .post(`/api/weddings/${weddingId}/events`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        name: 'Invalid Times Event',
        startsAt: '2027-03-15T20:00:00Z',
        endsAt: '2027-03-15T18:00:00Z',
        venueName: 'Palace',
        venueAddress: 'Jaipur',
      });
    expect(invalidEventRes.status).toBe(400);
    expect(invalidEventRes.body.error.message).toContain('End time must be after start time');

    // Valid event
    const validEventRes = await request(app)
      .post(`/api/weddings/${weddingId}/events`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        name: 'Mehendi Ceremony',
        startsAt: '2027-03-15T15:00:00Z',
        endsAt: '2027-03-15T19:00:00Z',
        venueName: 'The Oberoi Rajvilas',
        venueAddress: 'Jaipur, Rajasthan',
        cateringTarget: 150,
      });

    expect(validEventRes.status).toBe(201);
    expect(validEventRes.body.event.name).toBe('Mehendi Ceremony');
  });
});
