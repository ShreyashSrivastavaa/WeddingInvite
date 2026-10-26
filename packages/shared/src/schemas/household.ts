import { z } from 'zod';
import { Category, Side } from '../enums';
import { HOUSEHOLD_MAX_INVITED, HOUSEHOLD_MIN_INVITED } from '../constants';

export const householdSchema = z
  .object({
    displayName: z.string().min(1, 'Display name is required').max(150),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
    category: z.nativeEnum(Category).default(Category.FAMILY),
    side: z.nativeEnum(Side).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    memberNames: z.array(z.string().trim().min(1)).optional().default([]),
    invitedCount: z
      .number()
      .int()
      .min(
        HOUSEHOLD_MIN_INVITED,
        `Invited count must be at least ${HOUSEHOLD_MIN_INVITED}`
      )
      .max(
        HOUSEHOLD_MAX_INVITED,
        `Invited count cannot exceed ${HOUSEHOLD_MAX_INVITED}`
      )
      .default(1),
    followUpFlag: z.boolean().default(false),
    doNotContact: z.boolean().default(false),
    eventInvitedOverrides: z
      .array(
        z.object({
          eventId: z.string().min(1),
          invitedCount: z.number().int().min(1).max(HOUSEHOLD_MAX_INVITED),
          invited: z.boolean().default(true),
        })
      )
      .optional(),
  })
  .strict();

export type HouseholdInput = z.infer<typeof householdSchema>;

export const updateHouseholdSchema = householdSchema.partial();
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;

export interface CsvImportRowData {
  rowNumber: number;
  displayName: string;
  phoneRaw: string;
  phoneE164?: string;
  email?: string | null;
  category: Category;
  side?: Side | null;
  invitedCount: number;
  notes?: string | null;
  memberNames?: string[];
  isValid: boolean;
  errors: string[];
  duplicateWarning?: {
    existingHouseholdId: string;
    existingHouseholdName: string;
  };
}

export interface CsvImportPreviewResult {
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  duplicateWarningCount: number;
  rows: CsvImportRowData[];
}
