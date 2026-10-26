import { OrganizerStatus, RsvpStatus } from '../enums';

export interface StatusDerivationInput {
  hasResponse: boolean;
  responseStatus?: RsvpStatus | null;
  confirmedCount?: number;
  invitedCount: number;
  followUpFlag?: boolean;
  rsvpDeadline?: Date | string | null;
  invitationViewCount?: number;
  hasInvitationMarkedSent?: boolean;
  firstInvitationMarkedSentAt?: Date | string | null;
  latestReminderMarkedSentAt?: Date | string | null;
  reminderCount?: number;
  now?: Date;
}

export interface DerivedStatusResult {
  status: OrganizerStatus;
  label: string;
  reason?: string;
  isAwaiting: boolean;
}

/**
 * Derives the organizer-facing status in strict order of precedence (Section 5.6):
 * 1. ATTENDING / NOT_ATTENDING
 * 2. NEEDS_FOLLOW_UP (flag set, or deadline within 7 days / passed, or reminder sent > 72h ago)
 * 3. PENDING (opened link or reminder marked sent)
 * 4. INVITED (invitation marked sent)
 * 5. NOT_CONTACTED
 */
export function deriveHouseholdStatus(input: StatusDerivationInput): DerivedStatusResult {
  const now = input.now ? new Date(input.now) : new Date();

  // 1. A response exists
  if (input.hasResponse && input.responseStatus) {
    if (input.responseStatus === RsvpStatus.ATTENDING) {
      const confirmed = input.confirmedCount ?? input.invitedCount;
      const label =
        confirmed < input.invitedCount
          ? `Attending ${confirmed} of ${input.invitedCount}`
          : 'Attending';
      return {
        status: OrganizerStatus.ATTENDING,
        label,
        isAwaiting: false,
      };
    }

    if (input.responseStatus === RsvpStatus.NOT_ATTENDING) {
      return {
        status: OrganizerStatus.NOT_ATTENDING,
        label: 'Declined',
        isAwaiting: false,
      };
    }
  }

  // 2. NEEDS_FOLLOW_UP
  let needsFollowUp = false;
  let followUpReason = '';

  const deadlineDate = input.rsvpDeadline ? new Date(input.rsvpDeadline) : null;
  const isDeadlinePassed = deadlineDate ? now.getTime() >= deadlineDate.getTime() : false;
  const isDeadlineTooClose = deadlineDate
    ? deadlineDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000 && !isDeadlinePassed
    : false;

  const reminderDate = input.latestReminderMarkedSentAt
    ? new Date(input.latestReminderMarkedSentAt)
    : null;
  const isReminderStale = reminderDate
    ? now.getTime() - reminderDate.getTime() > 72 * 60 * 60 * 1000
    : false;

  if (input.followUpFlag) {
    needsFollowUp = true;
    followUpReason = 'Flagged for follow-up by organizer';
  } else if (isDeadlinePassed) {
    needsFollowUp = true;
    followUpReason = 'RSVP deadline has passed';
  } else if (isDeadlineTooClose) {
    needsFollowUp = true;
    const diffMs = deadlineDate!.getTime() - now.getTime();
    const daysLeft = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    followUpReason = `RSVP deadline in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  } else if (isReminderStale) {
    needsFollowUp = true;
    followUpReason = 'Reminder marked sent over 72 hours ago, no response';
  }

  if (needsFollowUp) {
    // Add additional context if available
    let detailedReason = followUpReason;
    if (input.firstInvitationMarkedSentAt) {
      const invitedDiffMs = now.getTime() - new Date(input.firstInvitationMarkedSentAt).getTime();
      const daysSinceInvited = Math.floor(invitedDiffMs / (24 * 60 * 60 * 1000));
      const reminderText = input.reminderCount
        ? `${input.reminderCount} reminder${input.reminderCount === 1 ? '' : 's'}`
        : 'no reminders';
      detailedReason = `${followUpReason} (Invited ${daysSinceInvited}d ago, ${reminderText})`;
    }

    return {
      status: OrganizerStatus.NEEDS_FOLLOW_UP,
      label: 'Needs Follow-Up',
      reason: detailedReason,
      isAwaiting: true,
    };
  }

  // 3. PENDING
  const hasViewed = (input.invitationViewCount ?? 0) > 0;
  const hasReminders = (input.reminderCount ?? 0) > 0;
  if (hasViewed || hasReminders) {
    const reason = hasViewed
      ? `Link opened (${input.invitationViewCount} time${input.invitationViewCount === 1 ? '' : 's'})`
      : 'Reminder marked sent';
    return {
      status: OrganizerStatus.PENDING,
      label: 'Pending',
      reason,
      isAwaiting: true,
    };
  }

  // 4. INVITED
  if (input.hasInvitationMarkedSent) {
    return {
      status: OrganizerStatus.INVITED,
      label: 'Invited',
      reason: 'Invitation marked sent',
      isAwaiting: true,
    };
  }

  // 5. NOT_CONTACTED
  return {
    status: OrganizerStatus.NOT_CONTACTED,
    label: 'Not Contacted',
    reason: 'Invitation not sent yet',
    isAwaiting: true,
  };
}
