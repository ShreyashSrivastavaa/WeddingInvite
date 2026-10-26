import { ArrivalWindow } from '../enums';

/**
 * Format a Date or ISO string into a human-friendly string in the given timezone.
 * Example: "Sat, 14 Feb 2027, 7:00 PM"
 */
export function formatDateInTimezone(
  dateInput: Date | string,
  timezone: string = 'Asia/Kolkata',
  formatStyle: 'full' | 'long' | 'medium' | 'short' | 'time' | string = 'medium'
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  try {
    if (formatStyle === 'time') {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    }

    if (formatStyle === 'd MMMM yyyy') {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: timezone,
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: timezone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Derive time-aware arrival window labels from an event's start time and timezone.
 * Example: "Around 7:00 PM" for ON_TIME.
 */
export function getArrivalWindowLabels(
  startsAt: Date | string,
  timezone: string = 'Asia/Kolkata'
): Record<ArrivalWindow, string> {
  const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const timeStr = formatDateInTimezone(date, timezone, 'time');

  const plus1 = new Date(date.getTime() + 60 * 60 * 1000);
  const plus1Str = formatDateInTimezone(plus1, timezone, 'time');

  const plus2 = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const plus2Str = formatDateInTimezone(plus2, timezone, 'time');

  return {
    [ArrivalWindow.ON_TIME]: `Around ${timeStr} (On time)`,
    [ArrivalWindow.WITHIN_1_HOUR_AFTER]: `${timeStr} – ${plus1Str} (Within 1 hour)`,
    [ArrivalWindow.ONE_TO_TWO_HOURS_AFTER]: `${plus1Str} – ${plus2Str} (1 to 2 hours after)`,
    [ArrivalWindow.MORE_THAN_TWO_HOURS_AFTER]: `After ${plus2Str} (Later arrival)`,
    [ArrivalWindow.NOT_SURE]: 'Not sure yet',
  };
}
