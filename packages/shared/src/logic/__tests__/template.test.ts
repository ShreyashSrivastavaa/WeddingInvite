import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppClickToChatUrl,
  DEFAULT_TEMPLATES,
  renderTemplate,
} from '../template';

describe('Message Template Rendering & WhatsApp URL Generation', () => {
  it('correctly substitutes placeholders when all variables are present', () => {
    const vars = {
      guest_name: 'Sharma',
      couple_names: 'Aarav & Ishita',
      event_name: 'Sangeet',
      date: 'Sat, 14 Feb 2027',
      venue: 'Taj Mahal Palace',
      deadline: '1 Feb 2027',
      rsvp_link: 'https://wedding.app/r/test-token',
    };

    const result = renderTemplate(DEFAULT_TEMPLATES.INVITATION, vars);

    expect(result.isValid).toBe(true);
    expect(result.missingVariables).toHaveLength(0);
    expect(result.text).toContain('Namaste Sharma ji,');
    expect(result.text).toContain('Aarav & Ishita warmly invite');
    expect(result.text).toContain('Sangeet on Sat, 14 Feb 2027');
    expect(result.text).toContain('https://wedding.app/r/test-token');
    expect(result.text).not.toContain('undefined');
  });

  it('fails validation visibly and does NOT render undefined when variables are missing', () => {
    const vars = {
      guest_name: 'Kapoor',
      // couple_names missing
      event_name: 'Wedding Ceremony',
    };

    const result = renderTemplate(DEFAULT_TEMPLATES.INVITATION, vars);

    expect(result.isValid).toBe(false);
    expect(result.missingVariables).toContain('couple_names');
    expect(result.missingVariables).toContain('date');
    expect(result.text).toContain('[Missing couple_names]');
    expect(result.text).not.toContain('undefined');
  });

  it('generates valid wa.me URLs with properly encoded Unicode, newlines, and Hindi text', () => {
    const message = 'Namaste शर्मा जी! 🎉\nWe invite you: https://app.com/r/xyz';
    const url = buildWhatsAppClickToChatUrl('+919876543210', message);

    expect(url.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('शर्मा जी! 🎉'));
    expect(url).toContain('%0A'); // newline encoded
  });
});
