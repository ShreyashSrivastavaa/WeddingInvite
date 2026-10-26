export enum Dietary {
  VEGETARIAN = 'VEGETARIAN',
  NON_VEGETARIAN = 'NON_VEGETARIAN',
  JAIN = 'JAIN',
  VEGAN = 'VEGAN',
  EGGETARIAN = 'EGGETARIAN',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

export const DIETARY_LABELS: Record<Dietary, string> = {
  [Dietary.VEGETARIAN]: 'Vegetarian',
  [Dietary.NON_VEGETARIAN]: 'Non-Vegetarian',
  [Dietary.JAIN]: 'Jain (No root vegetables)',
  [Dietary.VEGAN]: 'Vegan',
  [Dietary.EGGETARIAN]: 'Eggetarian',
  [Dietary.NO_PREFERENCE]: 'No Preference',
};

export const DEFAULT_DIETARY_OPTIONS: Dietary[] = [
  Dietary.VEGETARIAN,
  Dietary.NON_VEGETARIAN,
  Dietary.JAIN,
  Dietary.VEGAN,
];

export enum ArrivalWindow {
  ON_TIME = 'ON_TIME',
  WITHIN_1_HOUR_AFTER = 'WITHIN_1_HOUR_AFTER',
  ONE_TO_TWO_HOURS_AFTER = 'ONE_TO_TWO_HOURS_AFTER',
  MORE_THAN_TWO_HOURS_AFTER = 'MORE_THAN_TWO_HOURS_AFTER',
  NOT_SURE = 'NOT_SURE',
}

export const ARRIVAL_WINDOW_LABELS: Record<ArrivalWindow, string> = {
  [ArrivalWindow.ON_TIME]: 'On time / At event start',
  [ArrivalWindow.WITHIN_1_HOUR_AFTER]: 'Within 1 hour after start',
  [ArrivalWindow.ONE_TO_TWO_HOURS_AFTER]: '1 to 2 hours after start',
  [ArrivalWindow.MORE_THAN_TWO_HOURS_AFTER]: 'More than 2 hours after start',
  [ArrivalWindow.NOT_SURE]: 'Not sure yet',
};

export enum Category {
  FAMILY = 'FAMILY',
  FRIEND = 'FRIEND',
  COLLEAGUE = 'COLLEAGUE',
  VIP = 'VIP',
  OTHER = 'OTHER',
}

export enum Side {
  BRIDE = 'BRIDE',
  GROOM = 'GROOM',
}

export enum InvitationStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export enum RsvpStatus {
  ATTENDING = 'ATTENDING',
  NOT_ATTENDING = 'NOT_ATTENDING',
}

export enum RsvpSource {
  GUEST_LINK = 'GUEST_LINK',
  ORGANIZER_ENTRY = 'ORGANIZER_ENTRY',
}

export enum OptOutSource {
  GUEST = 'GUEST',
  ORGANIZER = 'ORGANIZER',
}

export enum MessageKind {
  INVITATION = 'INVITATION',
  REMINDER = 'REMINDER',
}

export enum MessageChannel {
  WHATSAPP_CLICK_TO_CHAT = 'WHATSAPP_CLICK_TO_CHAT',
  WHATSAPP_CLOUD_API = 'WHATSAPP_CLOUD_API',
  OTHER = 'OTHER',
}

export enum MessageStatus {
  PREPARED = 'PREPARED',
  MARKED_SENT = 'MARKED_SENT',
  SENT_BY_API = 'SENT_BY_API',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum OrganizerStatus {
  ATTENDING = 'ATTENDING',
  NOT_ATTENDING = 'NOT_ATTENDING',
  NEEDS_FOLLOW_UP = 'NEEDS_FOLLOW_UP',
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  NOT_CONTACTED = 'NOT_CONTACTED',
}

export const ORGANIZER_STATUS_CONFIG: Record<
  OrganizerStatus,
  { label: string; description: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }
> = {
  [OrganizerStatus.ATTENDING]: {
    label: 'Attending',
    description: 'Confirmed attending',
    variant: 'success',
  },
  [OrganizerStatus.NOT_ATTENDING]: {
    label: 'Declined',
    description: 'Confirmed not attending',
    variant: 'danger',
  },
  [OrganizerStatus.NEEDS_FOLLOW_UP]: {
    label: 'Needs Follow-Up',
    description: 'Deadline near or reminder unanswered',
    variant: 'warning',
  },
  [OrganizerStatus.PENDING]: {
    label: 'Pending',
    description: 'Link opened or reminder sent, no reply',
    variant: 'info',
  },
  [OrganizerStatus.INVITED]: {
    label: 'Invited',
    description: 'Invitation sent, not yet opened',
    variant: 'info',
  },
  [OrganizerStatus.NOT_CONTACTED]: {
    label: 'Not Contacted',
    description: 'Invitation not marked sent yet',
    variant: 'neutral',
  },
};
