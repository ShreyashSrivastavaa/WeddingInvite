import { describe, it, expect } from 'vitest';
import { formatPhoneDisplay, getPhoneForWhatsApp, normalizePhone } from '../phone';

describe('Phone Number Normalization & Formatting', () => {
  it('normalizes standard Indian mobile numbers with spacing', () => {
    const res = normalizePhone('98765 43210');
    expect(res.success).toBe(true);
    expect(res.phoneE164).toBe('+919876543210');
  });

  it('normalizes Indian numbers with +91 and dashes', () => {
    const res = normalizePhone('+91 98765-43210');
    expect(res.success).toBe(true);
    expect(res.phoneE164).toBe('+919876543210');
  });

  it('normalizes Indian numbers starting with single zero', () => {
    const res = normalizePhone('09876543210');
    expect(res.success).toBe(true);
    expect(res.phoneE164).toBe('+919876543210');
  });

  it('formats display cleanly for UI', () => {
    expect(formatPhoneDisplay('+919876543210')).toBe('+91 98765 43210');
  });

  it('extracts WhatsApp phone digits without plus', () => {
    expect(getPhoneForWhatsApp('+919876543210')).toBe('919876543210');
  });

  it('rejects invalid or too short numbers with friendly message', () => {
    const res = normalizePhone('12345');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Please enter a valid 10-digit mobile number');
  });

  it('rejects empty inputs', () => {
    const res = normalizePhone('');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
