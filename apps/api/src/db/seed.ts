import { PrismaClient } from '@prisma/client';
import {
  Dietary,
  MessageKind,
  MessageStatus,
  OptOutSource,
  RsvpSource,
  RsvpStatus,
  Side,
  Category,
  ArrivalWindow,
  DEFAULT_TEMPLATES,
} from '@rsvp/shared';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

export async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run seed script in production!');
    process.exit(1);
  }

  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "MessageLog", "RsvpRevision", "Attendee", "RsvpResponse", "Invitation", "HouseholdEvent", "Household", "Event", "Wedding", "Session", "User" CASCADE;'
  );

  // 1. Primary Demo Organizer
  const demoPasswordHash = await hashPassword('DemoPassword123!');
  const organizer1 = await prisma.user.create({
    data: {
      email: 'demo@wedding.com',
      passwordHash: demoPasswordHash,
      name: 'Aditi Rao',
      businessName: 'Vows & Veils Wedding Planners',
    },
  });

  // 2. Sample Wedding: Aarav & Ishita
  const wedding1 = await prisma.wedding.create({
    data: {
      ownerId: organizer1.id,
      title: 'Aarav & Ishita Wedding',
      partnerOneName: 'Aarav Sharma',
      partnerTwoName: 'Ishita Kapoor',
      invitationMessage:
        'Together with our families, we joyfully invite you to celebrate our union across three days of love, laughter, and traditions.',
      rsvpDeadline: new Date('2027-02-01T18:00:00Z'),
      timezone: 'Asia/Kolkata',
      dietaryOptions: [
        Dietary.VEGETARIAN,
        Dietary.NON_VEGETARIAN,
        Dietary.JAIN,
        Dietary.VEGAN,
      ],
      theme: 'ROYAL_IVORY_MAROON',
      cateringTarget: 250,
      allowChangesAfterDeadline: true,
      templateInvitation: DEFAULT_TEMPLATES.INVITATION,
      templateGentleReminder: DEFAULT_TEMPLATES.GENTLE_REMINDER,
      templateFinalReminder: DEFAULT_TEMPLATES.FINAL_REMINDER,
    },
  });

  // 3. Three Events for Aarav & Ishita
  const mehendi = await prisma.event.create({
    data: {
      weddingId: wedding1.id,
      name: 'Mehendi & Sundowner',
      startsAt: new Date('2027-02-12T15:00:00Z'),
      endsAt: new Date('2027-02-12T19:00:00Z'),
      venueName: 'The Courtyard, Rambagh Palace',
      venueAddress: 'Bhawani Singh Rd, Jaipur, Rajasthan 302005',
      cateringTarget: 180,
      sortOrder: 1,
    },
  });

  const sangeet = await prisma.event.create({
    data: {
      weddingId: wedding1.id,
      name: 'Sangeet & Musical Evening',
      startsAt: new Date('2027-02-13T19:00:00Z'),
      endsAt: new Date('2027-02-13T23:30:00Z'),
      venueName: 'Mubarak Mahal Ballroom, Rambagh Palace',
      venueAddress: 'Bhawani Singh Rd, Jaipur, Rajasthan 302005',
      cateringTarget: 250,
      sortOrder: 2,
    },
  });

  const weddingReception = await prisma.event.create({
    data: {
      weddingId: wedding1.id,
      name: 'Varmala & Grand Reception',
      startsAt: new Date('2027-02-14T18:30:00Z'),
      endsAt: new Date('2027-02-14T23:59:00Z'),
      venueName: 'Palace Lawns, Rambagh Palace',
      venueAddress: 'Bhawani Singh Rd, Jaipur, Rajasthan 302005',
      cateringTarget: 250,
      sortOrder: 3,
    },
  });

  const events = [mehendi, sangeet, weddingReception];

  // 4. Create ~40 households in varied states
  // Categories: FAMILY, FRIEND, COLLEAGUE, VIP, OTHER
  // Statuses: ATTENDING, NOT_ATTENDING, NEEDS_FOLLOW_UP, PENDING, INVITED, NOT_CONTACTED
  console.log('Creating sample households and responses...');

  const sampleHouseholdsData = [
    // 1-8: Confirmed Attending (all seats)
    { name: 'Dr. Rajesh & Sunita Sharma', count: 4, cat: Category.FAMILY, side: Side.GROOM, status: 'CONFIRMED_ALL' },
    { name: 'Virendra & Anjali Kapoor', count: 3, cat: Category.FAMILY, side: Side.BRIDE, status: 'CONFIRMED_ALL' },
    { name: 'Sameer & Ritu Malhotra', count: 2, cat: Category.FRIEND, side: Side.GROOM, status: 'CONFIRMED_ALL' },
    { name: 'Vikramaditya Birla', count: 2, cat: Category.VIP, side: Side.BRIDE, status: 'CONFIRMED_ALL' },
    { name: 'Pooja Hegde & Family', count: 4, cat: Category.FRIEND, side: Side.BRIDE, status: 'CONFIRMED_ALL' },
    { name: 'Rohan Mehra & Rohit Mehra', count: 2, cat: Category.COLLEAGUE, side: Side.GROOM, status: 'CONFIRMED_ALL' },
    { name: 'Prof. Arvind Nambiar', count: 1, cat: Category.VIP, side: Side.GROOM, status: 'CONFIRMED_ALL' },
    { name: 'Gaurav & Neha Bansal', count: 3, cat: Category.FAMILY, side: Side.BRIDE, status: 'CONFIRMED_ALL' },

    // 9-12: Partial Attendance (Household invited 4 confirms 3 or 2)
    { name: 'Kailash & Meena Agarwal', count: 4, cat: Category.FAMILY, side: Side.GROOM, status: 'CONFIRMED_PARTIAL_3' },
    { name: 'Sanjay & Archana Singhania', count: 4, cat: Category.FRIEND, side: Side.GROOM, status: 'CONFIRMED_PARTIAL_2' },
    { name: 'Harish & Vandana Oberoi', count: 5, cat: Category.FAMILY, side: Side.BRIDE, status: 'CONFIRMED_PARTIAL_3' },
    { name: 'Col. Ranjit & Deepa Thapar', count: 4, cat: Category.VIP, side: Side.BRIDE, status: 'CONFIRMED_PARTIAL_2' },

    // 13-17: Declined
    { name: 'Ashok & Sarita Verma', count: 2, cat: Category.FAMILY, side: Side.GROOM, status: 'DECLINED' },
    { name: 'Naveen & Shalini Pillai', count: 3, cat: Category.COLLEAGUE, side: Side.BRIDE, status: 'DECLINED' },
    { name: 'Manish & Preeti Goel', count: 4, cat: Category.FRIEND, side: Side.GROOM, status: 'DECLINED' },
    { name: 'Sudhir & Radhika Saxena', count: 2, cat: Category.OTHER, side: null, status: 'DECLINED' },
    { name: 'Tanvi Trivedi', count: 1, cat: Category.COLLEAGUE, side: Side.GROOM, status: 'DECLINED' },

    // 18-24: Needs Follow-Up (flag set, or reminder sent > 72h ago, or deadline close)
    { name: 'Justice Mukul & Shanti Mudgal', count: 2, cat: Category.VIP, side: Side.BRIDE, status: 'FOLLOW_UP_FLAGGED' },
    { name: 'Hemant & Sushma Dalmia', count: 4, cat: Category.FAMILY, side: Side.GROOM, status: 'FOLLOW_UP_REMINDER_OLD' },
    { name: 'Tarun & Renu Khanna', count: 3, cat: Category.FRIEND, side: Side.BRIDE, status: 'FOLLOW_UP_FLAGGED' },
    { name: 'Alok & Kavita Mittal', count: 4, cat: Category.FAMILY, side: Side.BRIDE, status: 'FOLLOW_UP_REMINDER_OLD' },
    { name: 'Deepak & Monica Chhabra', count: 2, cat: Category.COLLEAGUE, side: Side.GROOM, status: 'FOLLOW_UP_FLAGGED' },
    { name: 'Vinay & Poonam Bhatia', count: 3, cat: Category.FAMILY, side: Side.GROOM, status: 'FOLLOW_UP_FLAGGED' },
    { name: 'Lt. Gen. Baljit & Jasleen Brar', count: 2, cat: Category.VIP, side: Side.GROOM, status: 'FOLLOW_UP_FLAGGED' },

    // 25-32: Pending (link opened or recent reminder sent)
    { name: 'Aditya & Simran Roy', count: 2, cat: Category.FRIEND, side: Side.BRIDE, status: 'PENDING_VIEWED' },
    { name: 'Karthik & Sneha Swaminathan', count: 3, cat: Category.COLLEAGUE, side: Side.GROOM, status: 'PENDING_VIEWED' },
    { name: 'Bharat & Bhavna Mehta', count: 4, cat: Category.FAMILY, side: Side.BRIDE, status: 'PENDING_REMINDED' },
    { name: 'Siddharth & Tanya Rao', count: 2, cat: Category.FRIEND, side: Side.GROOM, status: 'PENDING_VIEWED' },
    { name: 'Nikhil & Tara Joshi', count: 3, cat: Category.FRIEND, side: Side.BRIDE, status: 'PENDING_REMINDED' },
    { name: 'Gautam & Nandita Sen', count: 2, cat: Category.COLLEAGUE, side: Side.GROOM, status: 'PENDING_VIEWED' },
    { name: 'Raghav & Vidya Menon', count: 3, cat: Category.FAMILY, side: Side.GROOM, status: 'PENDING_REMINDED' },
    { name: 'Praveen & Rekha Nair', count: 2, cat: Category.FRIEND, side: Side.BRIDE, status: 'PENDING_VIEWED' },

    // 33-37: Invited (invitation marked sent, not opened)
    { name: 'Anurag & Shweta Kashyap', count: 2, cat: Category.COLLEAGUE, side: Side.GROOM, status: 'INVITED_ONLY' },
    { name: 'Vivek & Natasha Deshpande', count: 4, cat: Category.FAMILY, side: Side.BRIDE, status: 'INVITED_ONLY' },
    { name: 'Mayank & Garima Tyagi', count: 3, cat: Category.FRIEND, side: Side.GROOM, status: 'INVITED_ONLY' },
    { name: 'Suresh & Lata Soni', count: 2, cat: Category.FAMILY, side: Side.GROOM, status: 'INVITED_ONLY' },
    { name: 'Prashant & Ananya Biswas', count: 3, cat: Category.OTHER, side: null, status: 'INVITED_ONLY' },

    // 38-42: Not Contacted (newly added, no message sent)
    { name: 'Pramod & Uma Shankar', count: 3, cat: Category.FAMILY, side: Side.BRIDE, status: 'NOT_CONTACTED' },
    { name: 'Nitin & Aarti Varma', count: 2, cat: Category.COLLEAGUE, side: Side.GROOM, status: 'NOT_CONTACTED' },
    { name: 'Kishore & Geeta Lodha', count: 4, cat: Category.VIP, side: Side.BRIDE, status: 'NOT_CONTACTED' },
    { name: 'Farhan & Zoya Akhtar', count: 2, cat: Category.FRIEND, side: Side.GROOM, status: 'NOT_CONTACTED' },
    { name: 'Abhishek & Divya Jain', count: 3, cat: Category.FAMILY, side: Side.GROOM, status: 'NOT_CONTACTED' },
  ];

  let phoneCounter = 9820000000;

  for (let i = 0; i < sampleHouseholdsData.length; i++) {
    const item = sampleHouseholdsData[i];
    phoneCounter++;
    const phoneE164 = `+91${phoneCounter}`;
    const token = `aarav-ishita-guest-${i + 1}-${Math.random().toString(36).substring(2, 10)}`;

    const household = await prisma.household.create({
      data: {
        weddingId: wedding1.id,
        displayName: item.name,
        phoneE164,
        category: item.cat,
        side: item.side,
        invitedCount: item.count,
        followUpFlag: item.status === 'FOLLOW_UP_FLAGGED',
      },
    });

    // Create invitation
    const viewCount = item.status.startsWith('PENDING_VIEWED') || item.status.startsWith('CONFIRMED') ? 2 : 0;
    await prisma.invitation.create({
      data: {
        householdId: household.id,
        token,
        viewCount,
        firstViewedAt: viewCount > 0 ? new Date(Date.now() - 5 * 24 * 3600000) : null,
        lastViewedAt: viewCount > 0 ? new Date(Date.now() - 2 * 24 * 3600000) : null,
      },
    });

    // Link to all 3 events
    for (const ev of events) {
      await prisma.householdEvent.create({
        data: {
          householdId: household.id,
          eventId: ev.id,
          invitedCount: item.count,
        },
      });

      // Handle responses
      if (item.status === 'CONFIRMED_ALL') {
        const resp = await prisma.rsvpResponse.create({
          data: {
            householdId: household.id,
            eventId: ev.id,
            status: RsvpStatus.ATTENDING,
            arrivalWindow: ArrivalWindow.ON_TIME,
            source: RsvpSource.GUEST_LINK,
            respondedAt: new Date(Date.now() - 4 * 24 * 3600000),
          },
        });
        await prisma.attendee.createMany({
          data: Array.from({ length: item.count }, (_, aIdx) => ({
            rsvpResponseId: resp.id,
            position: aIdx + 1,
            name: `${item.name.split('&')[0].trim()} Attendee ${aIdx + 1}`,
            dietary: aIdx % 2 === 0 ? Dietary.VEGETARIAN : Dietary.NON_VEGETARIAN,
          })),
        });
        await prisma.rsvpRevision.create({
          data: {
            householdId: household.id,
            eventId: ev.id,
            status: RsvpStatus.ATTENDING,
            confirmedCount: item.count,
            dietarySnapshot: [],
            source: RsvpSource.GUEST_LINK,
            createdAt: new Date(Date.now() - 4 * 24 * 3600000),
          },
        });
      } else if (item.status.startsWith('CONFIRMED_PARTIAL')) {
        const confirmedHeads = parseInt(item.status.slice(-1), 10);
        const resp = await prisma.rsvpResponse.create({
          data: {
            householdId: household.id,
            eventId: ev.id,
            status: RsvpStatus.ATTENDING,
            arrivalWindow: ArrivalWindow.WITHIN_1_HOUR_AFTER,
            source: RsvpSource.GUEST_LINK,
            respondedAt: new Date(Date.now() - 3 * 24 * 3600000),
          },
        });
        await prisma.attendee.createMany({
          data: Array.from({ length: confirmedHeads }, (_, aIdx) => ({
            rsvpResponseId: resp.id,
            position: aIdx + 1,
            name: `${item.name.split('&')[0].trim()} Attendee ${aIdx + 1}`,
            dietary: aIdx === 0 ? Dietary.JAIN : Dietary.VEGETARIAN,
          })),
        });
        await prisma.rsvpRevision.create({
          data: {
            householdId: household.id,
            eventId: ev.id,
            status: RsvpStatus.ATTENDING,
            confirmedCount: confirmedHeads,
            dietarySnapshot: [],
            source: RsvpSource.GUEST_LINK,
            createdAt: new Date(Date.now() - 3 * 24 * 3600000),
          },
        });
      } else if (item.status === 'DECLINED') {
        await prisma.rsvpResponse.create({
          data: {
            householdId: household.id,
            eventId: ev.id,
            status: RsvpStatus.NOT_ATTENDING,
            message: 'Sending our warmest blessings to the couple from afar!',
            source: RsvpSource.GUEST_LINK,
            respondedAt: new Date(Date.now() - 6 * 24 * 3600000),
          },
        });
        await prisma.rsvpRevision.create({
          data: {
            householdId: household.id,
            eventId: ev.id,
            status: RsvpStatus.NOT_ATTENDING,
            confirmedCount: 0,
            dietarySnapshot: [],
            source: RsvpSource.GUEST_LINK,
            createdAt: new Date(Date.now() - 6 * 24 * 3600000),
          },
        });
      }
    }

    // Message logs
    if (item.status !== 'NOT_CONTACTED') {
      await prisma.messageLog.create({
        data: {
          weddingId: wedding1.id,
          householdId: household.id,
          kind: MessageKind.INVITATION,
          status: MessageStatus.MARKED_SENT,
          templateKey: 'INVITATION',
          bodySnapshot: 'Invitation message sent',
          preparedAt: new Date(Date.now() - 8 * 24 * 3600000),
          markedSentAt: new Date(Date.now() - 8 * 24 * 3600000),
          createdByUserId: organizer1.id,
        },
      });
    }

    if (item.status === 'FOLLOW_UP_REMINDER_OLD') {
      await prisma.messageLog.create({
        data: {
          weddingId: wedding1.id,
          householdId: household.id,
          kind: MessageKind.REMINDER,
          status: MessageStatus.MARKED_SENT,
          templateKey: 'GENTLE_REMINDER',
          bodySnapshot: 'Gentle reminder sent',
          preparedAt: new Date(Date.now() - 4 * 24 * 3600000), // > 72h ago
          markedSentAt: new Date(Date.now() - 4 * 24 * 3600000),
          createdByUserId: organizer1.id,
        },
      });
    } else if (item.status === 'PENDING_REMINDED') {
      await prisma.messageLog.create({
        data: {
          weddingId: wedding1.id,
          householdId: household.id,
          kind: MessageKind.REMINDER,
          status: MessageStatus.MARKED_SENT,
          templateKey: 'GENTLE_REMINDER',
          bodySnapshot: 'Gentle reminder sent',
          preparedAt: new Date(Date.now() - 1 * 24 * 3600000), // 24h ago
          markedSentAt: new Date(Date.now() - 1 * 24 * 3600000),
          createdByUserId: organizer1.id,
        },
      });
    }
  }

  // 5. Second Organizer (for cross-organizer isolation verification)
  const organizer2 = await prisma.user.create({
    data: {
      email: 'organizer2@wedding.com',
      passwordHash: demoPasswordHash,
      name: 'Rohan Mehta',
      businessName: 'Royal Celebrations Ltd',
    },
  });

  const wedding2 = await prisma.wedding.create({
    data: {
      ownerId: organizer2.id,
      title: 'Kabir & Tara Wedding',
      partnerOneName: 'Kabir',
      partnerTwoName: 'Tara',
      rsvpDeadline: new Date('2027-04-15T18:00:00Z'),
      timezone: 'Asia/Kolkata',
      dietaryOptions: [Dietary.VEGETARIAN, Dietary.NON_VEGETARIAN],
      theme: 'SAFFRON_SUNRISE',
    },
  });

  await prisma.event.create({
    data: {
      weddingId: wedding2.id,
      name: 'Cocktail & Sangeet',
      startsAt: new Date('2027-04-20T19:00:00Z'),
      venueName: 'The Taj Mahal Palace',
      venueAddress: 'Apollo Bunder, Colaba, Mumbai 400001',
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('Demo Organizer Login:');
  console.log('  Email:    demo@wedding.com');
  console.log('  Password: DemoPassword123!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
