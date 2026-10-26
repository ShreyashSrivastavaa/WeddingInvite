import { z } from 'zod';
import { DEFAULT_DIETARY_OPTIONS, Dietary } from '../enums';
import { DEFAULT_THEME, DEFAULT_TIMEZONE } from '../constants';

export const weddingSchema = z
  .object({
    title: z.string().min(1, 'Wedding title is required').max(200),
    partnerOneName: z.string().min(1, 'Partner 1 name is required').max(100),
    partnerTwoName: z.string().max(100).optional().nullable(),
    invitationMessage: z.string().max(2000).optional().nullable(),
    rsvpDeadline: z.string().datetime().or(z.date()),
    timezone: z.string().default(DEFAULT_TIMEZONE),
    dietaryOptions: z
      .array(z.nativeEnum(Dietary))
      .min(1, 'At least one dietary option must be enabled')
      .default(DEFAULT_DIETARY_OPTIONS),
    theme: z.string().default(DEFAULT_THEME),
    coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
    cateringTarget: z.number().int().min(0).optional().nullable(),
    allowChangesAfterDeadline: z.boolean().default(true),
  })
  .strict();

export type WeddingInput = z.infer<typeof weddingSchema>;

export const updateWeddingSchema = weddingSchema.partial();
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
