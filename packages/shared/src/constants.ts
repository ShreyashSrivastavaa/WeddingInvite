export const PRODUCT_NAME = 'RSVP Wedding Manager';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_COUNTRY = 'IN';

export const CSV_MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB
export const CSV_MAX_ROWS = 5000;

export const HOUSEHOLD_MIN_INVITED = 1;
export const HOUSEHOLD_MAX_INVITED = 20;

export const PASSWORD_MIN_LENGTH = 10;
export const SESSION_DURATION_DAYS = 14;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export const TOKEN_BYTES = 24;

export type ThemeKey = 'ROYAL_IVORY_MAROON' | 'GOLDEN_SAFFRON' | 'PEACOCK_TEAL' | 'ROSE_PALACE' | 'FORNER_EARTHEN';

export interface ThemePreset {
  id: ThemeKey;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBackground: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}

export const THEME_PRESETS: Record<ThemeKey, ThemePreset> = {
  ROYAL_IVORY_MAROON: {
    id: 'ROYAL_IVORY_MAROON',
    name: 'Royal Ivory & Maroon',
    description: 'Traditional regal Indian wedding palette with deep maroon and warm gold accents.',
    primary: '#7a192c',
    secondary: '#d4af37',
    accent: '#b45309',
    background: '#fdfbf7',
    cardBackground: '#ffffff',
    textColor: '#1f2937',
    badgeBg: '#fef2f2',
    badgeText: '#991b1b',
  },
  GOLDEN_SAFFRON: {
    id: 'GOLDEN_SAFFRON',
    name: 'Golden Saffron',
    description: 'Warm festive marigold, rich brass gold, and auspicious saffron tones.',
    primary: '#b45309',
    secondary: '#eab308',
    accent: '#d97706',
    background: '#fffdfa',
    cardBackground: '#ffffff',
    textColor: '#1f2937',
    badgeBg: '#fffbeb',
    badgeText: '#92400e',
  },
  PEACOCK_TEAL: {
    id: 'PEACOCK_TEAL',
    name: 'Peacock Teal & Gold',
    description: 'Opulent peacock teal and emerald with royal champagne gold highlights.',
    primary: '#0f766e',
    secondary: '#d4af37',
    accent: '#0d9488',
    background: '#f4fbf9',
    cardBackground: '#ffffff',
    textColor: '#134e4a',
    badgeBg: '#f0fdfa',
    badgeText: '#115e59',
  },
  ROSE_PALACE: {
    id: 'ROSE_PALACE',
    name: 'Rose Palace & Ruby',
    description: 'Romantic vintage blush rose, royal ruby, and soft pearl undertones.',
    primary: '#9f1239',
    secondary: '#f43f5e',
    accent: '#be123c',
    background: '#fff5f7',
    cardBackground: '#ffffff',
    textColor: '#4c0519',
    badgeBg: '#fff1f2',
    badgeText: '#9f1239',
  },
  FORNER_EARTHEN: {
    id: 'FORNER_EARTHEN',
    name: 'Forner Warm Earthen',
    description: 'Ceramics atelier aesthetic: Bone canvas, roast coffee ink, linen cards, and sandstone accents.',
    primary: '#484036',
    secondary: '#cacab0',
    accent: '#666e72',
    background: '#faf5eb',
    cardBackground: '#ecece4',
    textColor: '#484036',
    badgeBg: '#f2e9cf',
    badgeText: '#33302c',
  },
};

export const DEFAULT_THEME: ThemeKey = 'ROYAL_IVORY_MAROON';

