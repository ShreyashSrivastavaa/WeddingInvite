import { PrismaClient } from '@prisma/client';
import {
  Dietary,
  RsvpSource,
  RsvpStatus,
  ArrivalWindow,
} from '@rsvp/shared';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

export async function seedScenario() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run scenario seed in production!');
    process.exit(1);
  }

  console.log('🌱 Seeding deterministic 400 / 280 / 30 / 90 scenario...');

  // Clean existing data
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "MessageLog", "RsvpRevision", "Attendee", "RsvpResponse", "Invitation", "HouseholdEvent", "Household", "Event", "Wedding", "Session", "User" CASCADE;'
  );

  const passwordHash = await hashPassword('DemoPassword123!');
  const organizer = await prisma.user.create({
    data: {
      email: 'demo@wedding.com',
      passwordHash,
      name: 'Aditi Rao',
      businessName: 'Vows & Veils Wedding Planners',
    },
  });

  const wedding = await prisma.wedding.create({
    data: {
      ownerId: organizer.id,
      title: 'Grand Scenario Wedding',
      partnerOneName: 'Dev',
      partnerTwoName: 'Rhea',
      rsvpDeadline: new Date('2027-08-01T18:00:00Z'),
      timezone: 'Asia/Kolkata',
      dietaryOptions: [Dietary.VEGETARIAN, Dietary.NON_VEGETARIAN, Dietary.JAIN, Dietary.VEGAN],
      cateringTarget: 300,
    },
  });

  const event = await prisma.event.create({
    data: {
      weddingId: wedding.id,
      name: 'Grand Banquet',
      startsAt: new Date('2027-08-15T19:00:00Z'),
      venueName: 'The Imperial Grand Ballroom',
      venueAddress: 'Janpath, New Delhi',
      cateringTarget: 300,
    },
  });

  // Target composition:
  // Total Invited: 400
  // Confirmed: 280
  // Declined: 30
  // Awaiting: 90
  // Note: Household invited for 4 confirms 3 (adds 3 confirmed, 1 declined)

  let phoneIndex = 9811000000;

  // 1. Partial household: Invited 4, Confirms 3 (Confirmed: 3, Declined: 1)
  phoneIndex++;
  const partialH = await prisma.household.create({
    data: {
      weddingId: wedding.id,
      displayName: 'Khanna Family (Invited 4, Confirms 3)',
      phoneE164: `+91${phoneIndex}`,
      invitedCount: 4,
    },
  });
  await prisma.householdEvent.create({
    data: { householdId: partialH.id, eventId: event.id, invitedCount: 4 },
  });
  const partialResp = await prisma.rsvpResponse.create({
    data: {
      householdId: partialH.id,
      eventId: event.id,
      status: RsvpStatus.ATTENDING,
      arrivalWindow: ArrivalWindow.ON_TIME,
      source: RsvpSource.GUEST_LINK,
    },
  });
  await prisma.attendee.createMany({
    data: [
      { rsvpResponseId: partialResp.id, position: 1, name: 'Guest 1', dietary: Dietary.VEGETARIAN },
      { rsvpResponseId: partialResp.id, position: 2, name: 'Guest 2', dietary: Dietary.VEGETARIAN },
      { rsvpResponseId: partialResp.id, position: 3, name: 'Guest 3', dietary: Dietary.NON_VEGETARIAN },
    ],
  });
  await prisma.rsvpRevision.create({
    data: {
      householdId: partialH.id,
      eventId: event.id,
      status: RsvpStatus.ATTENDING,
      confirmedCount: 3,
      dietarySnapshot: [],
      source: RsvpSource.GUEST_LINK,
    },
  });

  // Remaining confirmed needed: 280 - 3 = 277 confirmed
  // Let's create:
  // 69 households of 4 = 276 confirmed
  // 1 household of 1 = 1 confirmed
  // Total confirmed = 3 + 276 + 1 = 280 confirmed!
  for (let i = 0; i < 69; i++) {
    phoneIndex++;
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: `Attending Household ${i + 1}`,
        phoneE164: `+91${phoneIndex}`,
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
        arrivalWindow: ArrivalWindow.ON_TIME,
      },
    });
    await prisma.attendee.createMany({
      data: Array.from({ length: 4 }, (_, a) => ({
        rsvpResponseId: resp.id,
        position: a + 1,
        name: `Guest ${a + 1}`,
        dietary: a % 2 === 0 ? Dietary.VEGETARIAN : Dietary.NON_VEGETARIAN,
      })),
    });
    await prisma.rsvpRevision.create({
      data: {
        householdId: h.id,
        eventId: event.id,
        status: RsvpStatus.ATTENDING,
        confirmedCount: 4,
        dietarySnapshot: [],
        source: RsvpSource.GUEST_LINK,
      },
    });
  }

  phoneIndex++;
  const singleAttending = await prisma.household.create({
    data: {
      weddingId: wedding.id,
      displayName: 'Single Attending Guest',
      phoneE164: `+91${phoneIndex}`,
      invitedCount: 1,
    },
  });
  await prisma.householdEvent.create({
    data: { householdId: singleAttending.id, eventId: event.id, invitedCount: 1 },
  });
  const singleResp = await prisma.rsvpResponse.create({
    data: {
      householdId: singleAttending.id,
      eventId: event.id,
      status: RsvpStatus.ATTENDING,
      arrivalWindow: ArrivalWindow.ON_TIME,
    },
  });
  await prisma.attendee.create({
    data: {
      rsvpResponseId: singleResp.id,
      position: 1,
      name: 'Single Guest',
      dietary: Dietary.JAIN,
    },
  });
  await prisma.rsvpRevision.create({
    data: {
      householdId: singleAttending.id,
      eventId: event.id,
      status: RsvpStatus.ATTENDING,
      confirmedCount: 1,
      dietarySnapshot: [],
      source: RsvpSource.GUEST_LINK,
    },
  });

  // Declined needed:
  // partial household already contributed 1 decline (4 invited - 3 confirmed = 1).
  // Remaining declined needed: 30 - 1 = 29 declined.
  // Let's create:
  // 9 households of 3 = 27 declined
  // 1 household of 2 = 2 declined
  // Total declined = 1 + 27 + 2 = 30 declined!
  for (let i = 0; i < 9; i++) {
    phoneIndex++;
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: `Declined Household ${i + 1}`,
        phoneE164: `+91${phoneIndex}`,
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

  phoneIndex++;
  const hDec2 = await prisma.household.create({
    data: {
      weddingId: wedding.id,
      displayName: 'Declined Couple',
      phoneE164: `+91${phoneIndex}`,
      invitedCount: 2,
    },
  });
  await prisma.householdEvent.create({
    data: { householdId: hDec2.id, eventId: event.id, invitedCount: 2 },
  });
  await prisma.rsvpResponse.create({
    data: {
      householdId: hDec2.id,
      eventId: event.id,
      status: RsvpStatus.NOT_ATTENDING,
    },
  });

  // Awaiting needed: 90
  // Let's create 30 households of 3 = 90 awaiting (no response)
  for (let i = 0; i < 30; i++) {
    phoneIndex++;
    const h = await prisma.household.create({
      data: {
        weddingId: wedding.id,
        displayName: `Awaiting Household ${i + 1}`,
        phoneE164: `+91${phoneIndex}`,
        invitedCount: 3,
      },
    });
    await prisma.householdEvent.create({
      data: { householdId: h.id, eventId: event.id, invitedCount: 3 },
    });
  }

  console.log('✅ Scenario successfully seeded:');
  console.log('  Total Invited: 400');
  console.log('  Confirmed:     280 (includes 1 household invited 4, confirmed 3)');
  console.log('  Declined:      30');
  console.log('  Awaiting:      90');
  console.log('  Invariant:     280 + 30 + 90 = 400 (CONFIRMED)');
}

seedScenario()
  .catch((e) => {
    console.error('Scenario seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
