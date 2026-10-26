import { z } from 'zod';
import { ArrivalWindow, Dietary, RsvpStatus } from '../enums';

export const attendeeSchema = z
  .object({
    name: z.string().max(100).optional().nullable(),
    dietary: z.nativeEnum(Dietary).default(Dietary.NO_PREFERENCE),
    dietaryNote: z.string().max(200).optional().nullable(),
  })
  .strict();

export type AttendeeSubmission = z.infer<typeof attendeeSchema>;

export const eventRsvpSubmissionSchema = z
  .object({
    eventId: z.string().min(1, 'Event ID is required'),
    status: z.nativeEnum(RsvpStatus),
    arrivalWindow: z.nativeEnum(ArrivalWindow).optional().nullable(),
    message: z.string().max(500).optional().nullable(),
    extraSeatsRequested: z.number().int().min(0).max(20).optional().nullable(),
    attendees: z.array(attendeeSchema).default([]),
  })
  .strict();

export type EventRsvpSubmission = z.infer<typeof eventRsvpSubmissionSchema>;

export const householdRsvpSubmissionSchema = z
  .object({
    expectedVersion: z.number().int().min(0).optional(),
    events: z.array(eventRsvpSubmissionSchema).min(1, 'At least one event response is required'),
  })
  .strict();

export type HouseholdRsvpSubmission = z.infer<typeof householdRsvpSubmissionSchema>;

export interface PublicInvitationDetails {
  token: string;
  household: {
    id: string;
    displayName: string;
    invitedCount: number;
    doNotContact: boolean;
  };
  wedding: {
    id: string;
    title: string;
    partnerOneName: string;
    partnerTwoName?: string | null;
    invitationMessage?: string | null;
    rsvpDeadline: string;
    timezone: string;
    dietaryOptions: Dietary[];
    theme: string;
    coverImageUrl?: string | null;
    allowChangesAfterDeadline: boolean;
  };
  events: Array<{
    id: string;
    name: string;
    startsAt: string;
    endsAt?: string | null;
    venueName: string;
    venueAddress: string;
    mapsUrl?: string | null;
    description?: string | null;
    invitedCount: number;
    currentResponse?: {
      status: RsvpStatus;
      arrivalWindow?: ArrivalWindow | null;
      message?: string | null;
      extraSeatsRequested?: number | null;
      version: number;
      respondedAt: string;
      attendees: Array<{
        name?: string | null;
        dietary: Dietary;
        dietaryNote?: string | null;
      }>;
    } | null;
  }>;
}
