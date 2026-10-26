import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, clearTestDatabase, createTestUser } from './test-helpers';
import { prisma } from '../db/prisma';

describe('Authentication & Settings Endpoints', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a new organizer and sets HttpOnly session cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Aditi Rao',
      email: 'aditi@planners.com',
      password: 'StrongPassword123!',
      businessName: 'Aditi Events',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('aditi@planners.com');
    expect(res.body.user.passwordHash).toBeUndefined();

    // Check Set-Cookie
    const cookieHeader = res.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader[0]).toContain('rsvp_session=');
    expect(cookieHeader[0]).toContain('HttpOnly');
    expect(cookieHeader[0]).toContain('SameSite=Lax');
  });

  it('rejects registration with short password (< 10 chars)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: 'short@test.com',
      password: '12345',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fieldErrors?.password).toBeDefined();
  });

  it('authenticates valid credentials on login and rotates session', async () => {
    const { user } = await createTestUser('login@test.com', 'ValidPassword123!');

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com',
      password: 'ValidPassword123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects invalid password with generic error message', async () => {
    await createTestUser('login2@test.com', 'ValidPassword123!');

    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@test.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  it('returns current user via /api/auth/me when authenticated', async () => {
    const { user, sessionCookie } = await createTestUser();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe(user.email);
  });

  it('returns null user via /api/auth/me when unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('logs out and deletes server session', async () => {
    const { sessionCookie } = await createTestUser();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify subsequent /api/auth/me is unauthenticated
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);
    expect(meRes.body.user).toBeNull();
  });

  it('changes password with valid current password', async () => {
    const { sessionCookie } = await createTestUser('change@test.com', 'OldPassword123!');

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', sessionCookie)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewSecurePassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'change@test.com',
      password: 'NewSecurePassword123!',
    });
    expect(loginRes.status).toBe(200);
  });

  it('rejects password change if current password is wrong', async () => {
    const { sessionCookie } = await createTestUser('change2@test.com', 'OldPassword123!');

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', sessionCookie)
      .send({
        currentPassword: 'WrongOldPassword!',
        newPassword: 'NewSecurePassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
  });
});
