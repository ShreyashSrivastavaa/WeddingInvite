import { describe, it, expect } from 'vitest';
import { calculateEventAttendance } from '../attendance';
import { ArrivalWindow, Dietary, RsvpStatus } from '../../enums';

describe('Attendance Logic & Invariant Calculations', () => {
  it('calculates the 400 / 280 / 30 / 90 scenario accurately and satisfies the invariant', () => {
    // 400 invited total:
    // 280 confirmed
    // 30 declined
    // 90 awaiting
    const households = [
      // 70 households of 4 = 280, all 4 attending
      ...Array.from({ length: 70 }, (_, i) => ({
        householdId: `attending-${i}`,
        invitedCount: 4,
        response: {
          status: RsvpStatus.ATTENDING,
          attendees: Array.from({ length: 4 }, () => ({ dietary: Dietary.VEGETARIAN })),
          arrivalWindow: ArrivalWindow.ON_TIME,
        },
      })),
      // 10 households of 3 = 30, declining
      ...Array.from({ length: 10 }, (_, i) => ({
        householdId: `declined-${i}`,
        invitedCount: 3,
        response: {
          status: RsvpStatus.NOT_ATTENDING,
          attendees: [],
          arrivalWindow: null,
        },
      })),
      // 30 households of 3 = 90, awaiting (no response)
      ...Array.from({ length: 30 }, (_, i) => ({
        householdId: `awaiting-${i}`,
        invitedCount: 3,
        response: null,
      })),
    ];

    const result = calculateEventAttendance(households, 300);

    expect(result.invited).toBe(400);
    expect(result.confirmed).toBe(280);
    expect(result.declined).toBe(30);
    expect(result.awaiting).toBe(90);

    // Invariant: confirmed + declined + awaiting = invited
    expect(result.confirmed + result.declined + result.awaiting).toBe(result.invited);
    expect(result.isInvariantValid).toBe(true);

    // Response rates
    // Total households = 70 + 10 + 30 = 110. Responded = 80.
    expect(result.totalHouseholds).toBe(110);
    expect(result.respondedHouseholds).toBe(80);
    expect(result.householdResponseRate).toBeCloseTo(80 / 110, 4);

    // Person response rate: (280 + 30) / 400 = 310 / 400 = 0.775
    expect(result.personResponseRate).toBe(0.775);
    expect(result.personConfirmationRate).toBe(0.7);

    // Catering bounds
    expect(result.cateringBounds.minCertain).toBe(280);
    expect(result.cateringBounds.maxPossible).toBe(370); // 280 + 90
    expect(result.cateringTargetDiff).toBe(-20); // 280 - 300
  });

  it('handles partial household confirmation: invited 4, confirms 3', () => {
    const households = [
      {
        householdId: 'h-1',
        invitedCount: 4,
        response: {
          status: RsvpStatus.ATTENDING,
          attendees: [
            { dietary: Dietary.VEGETARIAN },
            { dietary: Dietary.NON_VEGETARIAN },
            { dietary: Dietary.JAIN },
          ],
          arrivalWindow: ArrivalWindow.WITHIN_1_HOUR_AFTER,
        },
      },
    ];

    const result = calculateEventAttendance(households);

    expect(result.invited).toBe(400 ? 4 : 4);
    expect(result.confirmed).toBe(3);
    expect(result.declined).toBe(1);
    expect(result.awaiting).toBe(0);
    expect(result.isInvariantValid).toBe(true);

    // Dietary totals tallied for 3 confirmed attendees
    expect(result.dietaryTotals[Dietary.VEGETARIAN]).toBe(1);
    expect(result.dietaryTotals[Dietary.NON_VEGETARIAN]).toBe(1);
    expect(result.dietaryTotals[Dietary.JAIN]).toBe(1);
    expect(result.dietaryTotals.total).toBe(3);

    // Arrival window
    expect(result.arrivalDistribution[ArrivalWindow.WITHIN_1_HOUR_AFTER]).toBe(3);
  });

  it('handles updates: household changes from 3 confirmed to 2 confirmed', () => {
    // Initial state: invited 4, confirmed 3
    const initial = calculateEventAttendance([
      {
        householdId: 'h-1',
        invitedCount: 4,
        response: {
          status: RsvpStatus.ATTENDING,
          attendees: [{ dietary: Dietary.VEGETARIAN }, { dietary: Dietary.VEGETARIAN }, { dietary: Dietary.VEGAN }],
        },
      },
    ]);
    expect(initial.confirmed).toBe(3);
    expect(initial.declined).toBe(1);

    // Updated state: confirmed 2
    const updated = calculateEventAttendance([
      {
        householdId: 'h-1',
        invitedCount: 4,
        response: {
          status: RsvpStatus.ATTENDING,
          attendees: [{ dietary: Dietary.VEGETARIAN }, { dietary: Dietary.VEGAN }],
        },
      },
    ]);
    expect(updated.confirmed).toBe(2);
    expect(updated.declined).toBe(2);
    expect(updated.isInvariantValid).toBe(true);
    expect(updated.dietaryTotals[Dietary.VEGETARIAN]).toBe(1);
    expect(updated.dietaryTotals[Dietary.VEGAN]).toBe(1);
    expect(updated.dietaryTotals.total).toBe(2);
  });

  it('never counts pending or awaiting households as confirmed', () => {
    const households = [
      {
        householdId: 'h-pending',
        invitedCount: 5,
        response: null,
      },
    ];

    const result = calculateEventAttendance(households);
    expect(result.confirmed).toBe(0);
    expect(result.declined).toBe(0);
    expect(result.awaiting).toBe(5);
    expect(result.dietaryTotals.total).toBe(0);
    expect(result.isInvariantValid).toBe(true);
  });
});
