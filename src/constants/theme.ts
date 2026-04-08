export const Colors = {
  // Brand palette — warm honey & brown from the Spotlit logo
  primary: '#4A2506',
  primaryLight: '#7B4A1E',
  primaryLighter: '#A0652E',
  secondary: '#C8956A',
  accent: '#E8B87D',
  accentLight: '#F5D4A8',
  gold: '#D4A843',

  // Backgrounds
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceWarm: '#FEF3E2',
  card: '#FFFAF5',

  // Text
  textPrimary: '#2D1810',
  textSecondary: '#6B4226',
  textMuted: '#A0784E',
  textLight: '#C8A882',
  textInverse: '#FFFFFF',

  // Status
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Progress moods
  improving: '#4CAF50',
  same: '#FF9800',
  worsening: '#F44336',

  // UI
  border: '#E8D4B8',
  borderLight: '#F0E4CC',
  shadow: 'rgba(74, 37, 6, 0.12)',
  overlay: 'rgba(0,0,0,0.5)',
  transparent: 'transparent',
} as const;

export const Typography = {
  // Font families — system fonts for reliability
  fontFamily: 'System',

  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
