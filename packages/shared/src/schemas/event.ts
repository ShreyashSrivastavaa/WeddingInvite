import { z } from 'zod';

export const baseEventSchema = z
  .object({
    name: z.string().min(1, 'Event name is required').max(150),
    startsAt: z.string().datetime().or(z.date()),
    endsAt: z.string().datetime().or(z.date()).optional().nullable(),
    venueName: z.string().min(1, 'Venue name is required').max(200),
    venueAddress: z.string().min(1, 'Venue address is required').max(500),
    mapsUrl: z.string().url().optional().nullable().or(z.literal('')),
    description: z.string().max(1000).optional().nullable(),
    cateringTarget: z.number().int().min(0).optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
  })
  .strict();

export const eventSchema = baseEventSchema.refine(
  (data) => {
    if (data.startsAt && data.endsAt) {
      return new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime();
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endsAt'],
  }
);

export type EventInput = z.infer<typeof eventSchema>;

export const updateEventSchema = baseEventSchema.partial().refine(
  (data) => {
    if (data.startsAt && data.endsAt) {
      return new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime();
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endsAt'],
  }
);

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
