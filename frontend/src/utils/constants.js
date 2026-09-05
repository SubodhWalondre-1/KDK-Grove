/**
 * Application Constants
 */
export const colors = {
  primary: '#4F46E5',
  secondary: '#7C3AED',
  accent: '#06B6D4',
  success: '#22C55E',   // maps to backend "green" status
  warning: '#F59E0B',   // maps to backend "yellow" status
  danger: '#EF4444',    // maps to backend "red" status
  background: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  darkBackground: '#0F172A',
};

export const gradient = 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)';
export const fontFamily = 'Poppins, sans-serif';

export const SPECIES_CATEGORIES = {
  HUMAN: 'human',
  ANIMAL: 'animal',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

export const STATUS_COLORS = {
  normal: colors.success,
  green: colors.success,
  borderline: colors.warning,
  yellow: colors.warning,
  critical: colors.danger,
  red: colors.danger,
  unknown: '#94A3B8',
};
