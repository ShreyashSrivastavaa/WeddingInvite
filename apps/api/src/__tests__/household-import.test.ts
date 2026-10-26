import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, clearTestDatabase, createTestUser } from './test-helpers';
import { prisma } from '../db/prisma';

describe('Household Management and CSV Import', () => {
  let organizer: any;
  let wedding: any;

  beforeEach(async () => {
    await clearTestDatabase();
    organizer = await createTestUser();

    wedding = await prisma.wedding.create({
      data: {
        ownerId: organizer.user.id,
        title: 'Kavita & Dev Wedding',
        partnerOneName: 'Kavita',
        partnerTwoName: 'Dev',
        rsvpDeadline: new Date('2027-04-01T10:00:00Z'),
        dietaryOptions: ['VEGETARIAN', 'NON_VEGETARIAN'],
      },
    });

    await prisma.event.create({
      data: {
        weddingId: wedding.id,
        name: 'Wedding & Reception',
        startsAt: new Date('2027-04-15T18:00:00Z'),
        venueName: 'Grand Hyatt',
        venueAddress: 'Mumbai',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates household with normalized phone and automatically creates an invitation token', async () => {
    const res = await request(app)
      .post(`/api/weddings/${wedding.id}/households`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        displayName: 'Verma Family',
        phone: '98765 43210',
        invitedCount: 4,
        category: 'FAMILY',
      });

    expect(res.status).toBe(201);
    expect(res.body.household.phoneE164).toBe('+919876543210');
    expect(res.body.household.invitation).toBeDefined();
    expect(res.body.household.invitation.token).toHaveLength(32); // 24 bytes base64url
    expect(res.body.duplicateWarning).toBeNull();
  });

  it('detects duplicate phone on create and returns a non-blocking warning', async () => {
    // First household with phone
    await request(app)
      .post(`/api/weddings/${wedding.id}/households`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        displayName: 'Original Household',
        phone: '+919876543210',
        invitedCount: 2,
      });

    // Second household with same phone
    const res = await request(app)
      .post(`/api/weddings/${wedding.id}/households`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        displayName: 'Sharing Phone Household',
        phone: '9876543210',
        invitedCount: 3,
      });

    expect(res.status).toBe(201); // Saved successfully (non-blocking)
    expect(res.body.duplicateWarning).toBeDefined();
    expect(res.body.duplicateWarning.existingHouseholdName).toBe('Original Household');
  });

  it('previews CSV import: detects 2 invalid rows, 1 duplicate phone, preserves Hindi names, and imports valid rows transactionally', async () => {
    // Existing household to trigger duplicate warning
    await request(app)
      .post(`/api/weddings/${wedding.id}/households`)
      .set('Cookie', organizer.sessionCookie)
      .send({
        displayName: 'Pre-existing Guest',
        phone: '+919811122233',
        invitedCount: 2,
      });

    // CSV with BOM, Hindi names, 2 invalid rows, 1 duplicate phone
    const csvContent =
      `\uFEFFname,phone,email,category,invited_count,notes\r\n` +
      `राजेश शर्मा,+91 98222 33344,rajesh@sharma.in,FAMILY,4,Bride uncle\r\n` + // Valid Hindi
      `,9833344455,missingname@test.com,FRIEND,2,No name\r\n` + // Invalid (no name)
      `Amitabh Sen,invalidphone,sen@test.com,COLLEAGUE,2,Bad phone\r\n` + // Invalid (bad phone)
      `Sunita Gupta,9811122233,sunita@test.com,FAMILY,3,Duplicate phone\r\n` + // Valid row, duplicate phone warning
      `Deepak Patel,+919844455566,deepak@test.com,VIP,2,Groom cousin\r\n`; // Valid

    // 1. Preview step
    const previewRes = await request(app)
      .post(`/api/weddings/${wedding.id}/households/import/preview`)
      .set('Cookie', organizer.sessionCookie)
      .send({ csvContent });

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.totalRows).toBe(5);
    expect(previewRes.body.validRowCount).toBe(3); // Rajesh, Sunita, Deepak
    expect(previewRes.body.invalidRowCount).toBe(2); // Missing name, Bad phone
    expect(previewRes.body.duplicateWarningCount).toBe(1); // Sunita shares phone with Pre-existing Guest

    // Check Hindi name survived
    const hindiRow = previewRes.body.rows.find((r: any) => r.displayName === 'राजेश शर्मा');
    expect(hindiRow).toBeDefined();
    expect(hindiRow.isValid).toBe(true);
    expect(hindiRow.phoneE164).toBe('+919822233344');

    // 2. Commit step (only valid rows)
    const validRows = previewRes.body.rows.filter((r: any) => r.isValid);
    const commitRes = await request(app)
      .post(`/api/weddings/${wedding.id}/households/import/commit`)
      .set('Cookie', organizer.sessionCookie)
      .send({ validRows });

    expect(commitRes.status).toBe(201);
    expect(commitRes.body.importedCount).toBe(3);

    // Verify all 3 imported households exist in database with invitation tokens and linked to event
    const importedDb = await prisma.household.findMany({
      where: { weddingId: wedding.id, displayName: 'राजेश शर्मा' },
      include: { invitation: true, events: true },
    });
    expect(importedDb).toHaveLength(1);
    expect(importedDb[0].displayName).toBe('राजेश शर्मा');
    expect(importedDb[0].invitation?.token).toBeDefined();
    expect(importedDb[0].events).toHaveLength(1);
    expect(importedDb[0].events[0].invitedCount).toBe(4);
  });
});
