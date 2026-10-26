import { describe, it, expect } from 'vitest';
import { deriveHouseholdStatus } from '../status';
import { OrganizerStatus, RsvpStatus } from '../../enums';

describe('Status Precedence Derivation', () => {
  const baseNow = new Date('2027-02-01T10:00:00Z');

  it('1a. returns ATTENDING when a response exists with status ATTENDING', () => {
    const result = deriveHouseholdStatus({
      hasResponse: true,
      responseStatus: RsvpStatus.ATTENDING,
      confirmedCount: 4,
      invitedCount: 4,
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.ATTENDING);
    expect(result.label).toBe('Attending');
    expect(result.isAwaiting).toBe(false);
  });

  it('1b. returns Attending X of Y when confirmed is less than invited', () => {
    const result = deriveHouseholdStatus({
      hasResponse: true,
      responseStatus: RsvpStatus.ATTENDING,
      confirmedCount: 2,
      invitedCount: 4,
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.ATTENDING);
    expect(result.label).toBe('Attending 2 of 4');
    expect(result.isAwaiting).toBe(false);
  });

  it('1c. returns NOT_ATTENDING when response is NOT_ATTENDING', () => {
    const result = deriveHouseholdStatus({
      hasResponse: true,
      responseStatus: RsvpStatus.NOT_ATTENDING,
      invitedCount: 3,
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.NOT_ATTENDING);
    expect(result.label).toBe('Declined');
    expect(result.isAwaiting).toBe(false);
  });

  it('2a. returns NEEDS_FOLLOW_UP when followUpFlag is explicitly set', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      followUpFlag: true,
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.NEEDS_FOLLOW_UP);
    expect(result.isAwaiting).toBe(true);
    expect(result.reason).toContain('Flagged for follow-up');
  });

  it('2b. returns NEEDS_FOLLOW_UP when deadline has passed', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      rsvpDeadline: new Date('2027-01-30T10:00:00Z'), // 2 days ago
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.NEEDS_FOLLOW_UP);
    expect(result.reason).toContain('deadline has passed');
  });

  it('2c. returns NEEDS_FOLLOW_UP when deadline is within 7 days', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      rsvpDeadline: new Date('2027-02-05T10:00:00Z'), // in 4 days
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.NEEDS_FOLLOW_UP);
    expect(result.reason).toContain('RSVP deadline in 4 days');
  });

  it('2d. returns NEEDS_FOLLOW_UP when latest reminder was sent > 72h ago', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      latestReminderMarkedSentAt: new Date('2027-01-28T09:00:00Z'), // ~4 days ago
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.NEEDS_FOLLOW_UP);
    expect(result.reason).toContain('over 72 hours ago');
  });

  it('3a. returns PENDING when invitation link was viewed at least once', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      invitationViewCount: 2,
      rsvpDeadline: new Date('2027-03-01T10:00:00Z'), // > 7 days away
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.PENDING);
    expect(result.label).toBe('Pending');
    expect(result.isAwaiting).toBe(true);
  });

  it('3b. returns PENDING when reminder sent recently (<= 72h)', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      reminderCount: 1,
      latestReminderMarkedSentAt: new Date('2027-01-31T12:00:00Z'), // 22 hours ago
      rsvpDeadline: new Date('2027-03-01T10:00:00Z'),
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.PENDING);
    expect(result.isAwaiting).toBe(true);
  });

  it('4. returns INVITED when invitation was marked sent but not opened', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      hasInvitationMarkedSent: true,
      invitationViewCount: 0,
      reminderCount: 0,
      rsvpDeadline: new Date('2027-03-01T10:00:00Z'),
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.INVITED);
    expect(result.isAwaiting).toBe(true);
  });

  it('5. returns NOT_CONTACTED when no invitation marked sent and no response', () => {
    const result = deriveHouseholdStatus({
      hasResponse: false,
      invitedCount: 2,
      hasInvitationMarkedSent: false,
      invitationViewCount: 0,
      reminderCount: 0,
      rsvpDeadline: new Date('2027-03-01T10:00:00Z'),
      now: baseNow,
    });

    expect(result.status).toBe(OrganizerStatus.NOT_CONTACTED);
    expect(result.isAwaiting).toBe(true);
  });
});
