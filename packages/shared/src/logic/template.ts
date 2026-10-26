import { getPhoneForWhatsApp } from './phone';

export interface TemplateVariables {
  guest_name?: string;
  couple_names?: string;
  event_name?: string;
  date?: string;
  venue?: string;
  deadline?: string;
  rsvp_link?: string;
  [key: string]: string | undefined;
}

export const DEFAULT_TEMPLATES = {
  INVITATION:
    'Namaste {guest_name} ji,\n\nWith the blessings of our elders, {couple_names} warmly invite you and your family to {event_name} on {date} at {venue}.\n\nKindly let us know if you can join us by {deadline}. It takes less than a minute: {rsvp_link}\n\nWe would be so happy to celebrate with you!',
  GENTLE_REMINDER:
    "Namaste {guest_name} ji, a gentle reminder about {couple_names}'s {event_name} on {date}. We have not yet received your RSVP. Could you please confirm here by {deadline}? {rsvp_link}\n\nThank you so much!\n(Reply STOP if you'd rather not get reminders)",
  FINAL_REMINDER:
    "Hello {guest_name} ji, we are finalising arrangements for {couple_names}'s wedding and would really like to know if you can join us. Please confirm here: {rsvp_link}. If you have already replied, kindly ignore this message. Thank you!\n(Reply STOP if you'd rather not get reminders)",
};

export interface RenderTemplateResult {
  text: string;
  missingVariables: string[];
  isValid: boolean;
  charCount: number;
}

/**
 * Renders a message template by substituting {variable} placeholders.
 * Missing variables are flagged and NOT rendered as 'undefined'.
 */
export function renderTemplate(
  templateText: string,
  variables: TemplateVariables
): RenderTemplateResult {
  const missingVariables: string[] = [];
  const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;

  // Find all placeholders
  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(templateText)) !== null) {
    const varName = match[1];
    const val = variables[varName];
    if (val === undefined || val === null || val.trim() === '') {
      if (!missingVariables.includes(varName)) {
        missingVariables.push(varName);
      }
    }
  }

  // Replace placeholders
  const text = templateText.replace(placeholderRegex, (fullMatch, varName) => {
    const val = variables[varName];
    if (val === undefined || val === null || val.trim() === '') {
      return `[Missing ${varName}]`;
    }
    return val;
  });

  return {
    text,
    missingVariables,
    isValid: missingVariables.length === 0,
    charCount: text.length,
  };
}

/**
 * Builds a WhatsApp click-to-chat link (https://wa.me/<phoneDigits>?text=<encoded>)
 * Handles complete URL encoding for Unicode, Emojis, and Devanagari characters.
 */
export function buildWhatsAppClickToChatUrl(
  phoneE164: string,
  messageText: string
): string {
  const phoneDigits = getPhoneForWhatsApp(phoneE164);
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${phoneDigits}?text=${encodedText}`;
}
