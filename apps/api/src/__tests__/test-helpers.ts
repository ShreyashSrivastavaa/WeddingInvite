import { createServer } from '../server';
import { prisma } from '../db/prisma';
import { hashPassword, generateSessionToken, hashSessionToken, SESSION_COOKIE_NAME } from '../utils/auth';
import { SESSION_DURATION_MS } from '@rsvp/shared';

export const app = createServer();

export async function clearTestDatabase(): Promise<void> {
  // Single atomic truncate with CASCADE across all tables
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "MessageLog", "RsvpRevision", "Attendee", "RsvpResponse", "Invitation", "HouseholdEvent", "Household", "Event", "Wedding", "Session", "User" CASCADE;'
  );
}

export async function createTestUser(
  email?: string,
  password = 'Password1234!'
) {
  const userEmail =
    email || `organizer-${Date.now()}-${Math.floor(Math.random() * 1000000)}@wedding.test`;
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: 'Test Organizer',
      email: userEmail.toLowerCase(),
      passwordHash,
      businessName: 'Royal Wedding Planners',
    },
  });

  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });

  return {
    user,
    sessionCookie: `${SESSION_COOKIE_NAME}=${rawToken}`,
  };
}
