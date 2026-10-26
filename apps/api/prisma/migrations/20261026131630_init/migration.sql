-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FAMILY', 'FRIEND', 'COLLEAGUE', 'VIP', 'OTHER');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('BRIDE', 'GROOM');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('ATTENDING', 'NOT_ATTENDING');

-- CreateEnum
CREATE TYPE "RsvpSource" AS ENUM ('GUEST_LINK', 'ORGANIZER_ENTRY');

-- CreateEnum
CREATE TYPE "OptOutSource" AS ENUM ('GUEST', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "Dietary" AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'JAIN', 'VEGAN', 'EGGETARIAN', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "ArrivalWindow" AS ENUM ('ON_TIME', 'WITHIN_1_HOUR_AFTER', 'ONE_TO_TWO_HOURS_AFTER', 'MORE_THAN_TWO_HOURS_AFTER', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('INVITATION', 'REMINDER');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP_CLICK_TO_CHAT', 'WHATSAPP_CLOUD_API', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PREPARED', 'MARKED_SENT', 'SENT_BY_API', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "partnerOneName" TEXT NOT NULL,
    "partnerTwoName" TEXT,
    "invitationMessage" TEXT,
    "rsvpDeadline" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "dietaryOptions" "Dietary"[],
    "theme" TEXT NOT NULL DEFAULT 'ROYAL_IVORY_MAROON',
    "coverImageUrl" TEXT,
    "cateringTarget" INTEGER,
    "allowChangesAfterDeadline" BOOLEAN NOT NULL DEFAULT true,
    "templateInvitation" TEXT,
    "templateGentleReminder" TEXT,
    "templateFinalReminder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "mapsUrl" TEXT,
    "description" TEXT,
    "cateringTarget" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "email" TEXT,
    "category" "Category" NOT NULL DEFAULT 'FAMILY',
    "side" "Side",
    "notes" TEXT,
    "memberNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invitedCount" INTEGER NOT NULL DEFAULT 1,
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "optOutAt" TIMESTAMP(3),
    "optOutSource" "OptOutSource",
    "followUpFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdEvent" (
    "householdId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "invitedCount" INTEGER NOT NULL,

    CONSTRAINT "HouseholdEvent_pkey" PRIMARY KEY ("householdId","eventId")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpResponse" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL,
    "arrivalWindow" "ArrivalWindow",
    "message" TEXT,
    "extraSeatsRequested" INTEGER,
    "source" "RsvpSource" NOT NULL DEFAULT 'GUEST_LINK',
    "version" INTEGER NOT NULL DEFAULT 1,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RsvpResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL,
    "rsvpResponseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT,
    "dietary" "Dietary" NOT NULL DEFAULT 'NO_PREFERENCE',
    "dietaryNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpRevision" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL,
    "confirmedCount" INTEGER NOT NULL,
    "dietarySnapshot" JSONB NOT NULL,
    "source" "RsvpSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RsvpRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "eventId" TEXT,
    "kind" "MessageKind" NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP_CLICK_TO_CHAT',
    "status" "MessageStatus" NOT NULL DEFAULT 'PREPARED',
    "templateKey" TEXT NOT NULL,
    "bodySnapshot" TEXT NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedSentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_tokenHash_idx" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Wedding_ownerId_idx" ON "Wedding"("ownerId");

-- CreateIndex
CREATE INDEX "Event_weddingId_startsAt_idx" ON "Event"("weddingId", "startsAt");

-- CreateIndex
CREATE INDEX "Household_weddingId_phoneE164_idx" ON "Household"("weddingId", "phoneE164");

-- CreateIndex
CREATE INDEX "Household_weddingId_displayName_idx" ON "Household"("weddingId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_householdId_key" ON "Invitation"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "RsvpResponse_eventId_status_idx" ON "RsvpResponse"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpResponse_householdId_eventId_key" ON "RsvpResponse"("householdId", "eventId");

-- CreateIndex
CREATE INDEX "Attendee_rsvpResponseId_idx" ON "Attendee"("rsvpResponseId");

-- CreateIndex
CREATE INDEX "RsvpRevision_eventId_createdAt_idx" ON "RsvpRevision"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "RsvpRevision_householdId_idx" ON "RsvpRevision"("householdId");

-- CreateIndex
CREATE INDEX "MessageLog_weddingId_householdId_idx" ON "MessageLog"("weddingId", "householdId");

-- CreateIndex
CREATE INDEX "MessageLog_householdId_status_idx" ON "MessageLog"("householdId", "status");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdEvent" ADD CONSTRAINT "HouseholdEvent_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdEvent" ADD CONSTRAINT "HouseholdEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_householdId_eventId_fkey" FOREIGN KEY ("householdId", "eventId") REFERENCES "HouseholdEvent"("householdId", "eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_rsvpResponseId_fkey" FOREIGN KEY ("rsvpResponseId") REFERENCES "RsvpResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpRevision" ADD CONSTRAINT "RsvpRevision_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RsvpRevision" ADD CONSTRAINT "RsvpRevision_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
