import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { DEFAULT_COUNTRY } from '../constants';

export interface PhoneNormalizeResult {
  success: boolean;
  phoneE164?: string;
  error?: string;
}

export function normalizePhone(
  raw: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY as CountryCode
): PhoneNormalizeResult {
  if (!raw || typeof raw !== 'string') {
    return { success: false, error: 'Phone number is required' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, error: 'Phone number cannot be empty' };
  }

  // Handle Indian domestic numbers starting with single 0 (e.g. 09876543210)
  let cleanInput = trimmed;
  if (/^0\d{10}$/.test(trimmed)) {
    cleanInput = trimmed.substring(1);
  }

  try {
    const phoneNumber = parsePhoneNumberFromString(cleanInput, defaultCountry);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return {
        success: false,
        error: `Invalid phone number. Please enter a valid 10-digit mobile number (e.g. 98765 43210 or +91 98765 43210).`,
      };
    }

    return {
      success: true,
      phoneE164: phoneNumber.format('E.164'),
    };
  } catch {
    return {
      success: false,
      error: `Could not parse phone number. Please check the format.`,
    };
  }
}

export function formatPhoneDisplay(phoneE164: string): string {
  if (!phoneE164) return '';
  const parsed = parsePhoneNumberFromString(phoneE164);
  return parsed ? parsed.formatInternational() : phoneE164;
}

/**
 * Returns digits-only without '+' for wa.me URLs (e.g. 919876543210)
 */
export function getPhoneForWhatsApp(phoneE164: string): string {
  if (!phoneE164) return '';
  return phoneE164.replace(/\D/g, '');
}
