import { ArrivalWindow, Dietary, RsvpStatus } from '../enums';

export interface AttendeeInput {
  dietary: Dietary;
  name?: string | null;
}

export interface HouseholdEventInput {
  householdId: string;
  invitedCount: number;
  response?: {
    status: RsvpStatus;
    attendees: AttendeeInput[];
    arrivalWindow?: ArrivalWindow | null;
  } | null;
  isContacted?: boolean;
}

export interface DietaryTotals {
  [Dietary.VEGETARIAN]: number;
  [Dietary.NON_VEGETARIAN]: number;
  [Dietary.JAIN]: number;
  [Dietary.VEGAN]: number;
  [Dietary.EGGETARIAN]: number;
  [Dietary.NO_PREFERENCE]: number;
  total: number;
}

export interface ArrivalDistribution {
  [ArrivalWindow.ON_TIME]: number;
  [ArrivalWindow.WITHIN_1_HOUR_AFTER]: number;
  [ArrivalWindow.ONE_TO_TWO_HOURS_AFTER]: number;
  [ArrivalWindow.MORE_THAN_TWO_HOURS_AFTER]: number;
  [ArrivalWindow.NOT_SURE]: number;
  total: number;
}

export interface EventAttendanceSummary {
  // People metrics (Section 5.1 & 5.2)
  invited: number;
  confirmed: number;
  declined: number;
  awaiting: number;

  // Household metrics
  totalHouseholds: number;
  respondedHouseholds: number;
  notYetContactedHouseholds: number;
  notYetContactedPeople: number;

  // Rates (0 to 1)
  householdResponseRate: number;
  personResponseRate: number;
  personConfirmationRate: number;

  // Catering Bounds (Section 5.2)
  cateringBounds: {
    minCertain: number; // confirmed
    maxPossible: number; // confirmed + awaiting
  };
  cateringTarget?: number | null;
  cateringTargetDiff?: number | null;

  // Detailed breakdowns (attending only)
  dietaryTotals: DietaryTotals;
  arrivalDistribution: ArrivalDistribution;

  // Integrity assertion
  isInvariantValid: boolean;
}

/**
 * Pure function to calculate attendance, rates, bounds, and breakdowns for an event.
 * Strictly adheres to Invariant: confirmed + declined + awaiting = invited
 */
export function calculateEventAttendance(
  households: HouseholdEventInput[],
  cateringTarget?: number | null
): EventAttendanceSummary {
  let invited = 0;
  let confirmed = 0;
  let declined = 0;
  let awaiting = 0;

  let totalHouseholds = 0;
  let respondedHouseholds = 0;
  let notYetContactedHouseholds = 0;
  let notYetContactedPeople = 0;

  const dietaryTotals: DietaryTotals = {
    [Dietary.VEGETARIAN]: 0,
    [Dietary.NON_VEGETARIAN]: 0,
    [Dietary.JAIN]: 0,
    [Dietary.VEGAN]: 0,
    [Dietary.EGGETARIAN]: 0,
    [Dietary.NO_PREFERENCE]: 0,
    total: 0,
  };

  const arrivalDistribution: ArrivalDistribution = {
    [ArrivalWindow.ON_TIME]: 0,
    [ArrivalWindow.WITHIN_1_HOUR_AFTER]: 0,
    [ArrivalWindow.ONE_TO_TWO_HOURS_AFTER]: 0,
    [ArrivalWindow.MORE_THAN_TWO_HOURS_AFTER]: 0,
    [ArrivalWindow.NOT_SURE]: 0,
    total: 0,
  };

  for (const h of households) {
    const invCount = Math.max(0, h.invitedCount);
    invited += invCount;
    totalHouseholds += 1;

    const res = h.response;
    if (!res) {
      // No response yet
      awaiting += invCount;
      if (!h.isContacted) {
        notYetContactedHouseholds += 1;
        notYetContactedPeople += invCount;
      }
    } else {
      respondedHouseholds += 1;
      if (res.status === RsvpStatus.ATTENDING) {
        const attendeeCount = res.attendees ? res.attendees.length : 0;
        // Cap attendees to invitedCount defensively
        const effectiveAttendees = Math.min(attendeeCount, invCount);
        confirmed += effectiveAttendees;

        // Partial decline contributes difference: invitedCount - confirmed
        const partialDecline = Math.max(0, invCount - effectiveAttendees);
        declined += partialDecline;

        // Tally dietary for confirmed attendees
        for (let i = 0; i < effectiveAttendees; i++) {
          const att = res.attendees[i];
          const dietaryKey = att?.dietary || Dietary.NO_PREFERENCE;
          dietaryTotals[dietaryKey] = (dietaryTotals[dietaryKey] || 0) + 1;
          dietaryTotals.total += 1;
        }

        // Tally arrival distribution: the household's window applies to its confirmed attendees
        const windowKey = res.arrivalWindow || ArrivalWindow.NOT_SURE;
        arrivalDistribution[windowKey] = (arrivalDistribution[windowKey] || 0) + effectiveAttendees;
        arrivalDistribution.total += effectiveAttendees;
      } else if (res.status === RsvpStatus.NOT_ATTENDING) {
        // Full decline contributes the entire invitedCount
        declined += invCount;
      }
    }
  }

  // Check invariant: confirmed + declined + awaiting = invited
  const isInvariantValid = confirmed + declined + awaiting === invited;

  if (!isInvariantValid && process.env.NODE_ENV !== 'production') {
    // Runtime assertion in dev / test
    console.error(
      `[INVARIANT VIOLATION] confirmed (${confirmed}) + declined (${declined}) + awaiting (${awaiting}) = ${
        confirmed + declined + awaiting
      } != invited (${invited})`
    );
  }

  const householdResponseRate =
    totalHouseholds > 0 ? respondedHouseholds / totalHouseholds : 0;
  const personResponseRate = invited > 0 ? (confirmed + declined) / invited : 0;
  const personConfirmationRate = invited > 0 ? confirmed / invited : 0;

  const cateringTargetDiff =
    typeof cateringTarget === 'number' ? confirmed - cateringTarget : null;

  return {
    invited,
    confirmed,
    declined,
    awaiting,
    totalHouseholds,
    respondedHouseholds,
    notYetContactedHouseholds,
    notYetContactedPeople,
    householdResponseRate,
    personResponseRate,
    personConfirmationRate,
    cateringBounds: {
      minCertain: confirmed,
      maxPossible: confirmed + awaiting,
    },
    cateringTarget,
    cateringTargetDiff,
    dietaryTotals,
    arrivalDistribution,
    isInvariantValid,
  };
}
