/**
 * SabiSpell Design Token System
 *
 * Colour values are chosen to match the OKLch perceptual targets defined in
 * the PRD, expressed as sRGB hex for React Native compatibility (RN does not
 * natively parse oklch() strings).
 *
 * Themes:
 *   'sss'     → Lagoon Blue   (SSS Academic League — primary demo theme)
 *   'wazobia' → Terracotta    (Wazobia Mode)
 *   'jss'     → Teal / Navy   (JSS Scholar)
 *   'primary' → Sky Blue      (Junior Explorer)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeKey = 'sss' | 'wazobia' | 'jss' | 'primary';

export interface ThemeTokens {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgOverlay: string;

  // Brand colours
  brandPrimary: string;
  brandSecondary: string;
  brandAccent: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnBrand: string;

  // Semantic feedback
  success: string;
  error: string;
  warning: string;
  info: string;

  // UI chrome
  border: string;
  divider: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocused: string;

  // Game UI components
  energyFill: string;
  energyEmpty: string;
  xpFill: string;
  xpTrack: string;
  streakFlame: string;
  coinGold: string;

  // Timer bar
  timerSafe: string;
  timerWarn: string;
  timerDanger: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SSS Theme — Lagoon Blue (primary demo theme)
// Target palette: deep lagoon teal-blue + gold accent + cool-white background.
// OKLch targets: primary oklch(0.48 0.18 240), accent oklch(0.76 0.17 72)
// ─────────────────────────────────────────────────────────────────────────────
const sss: ThemeTokens = {
  bgPrimary:         '#EEF5FC', // oklch(0.96 0.02 235) — soft ice-blue
  bgSecondary:       '#DCE9F8', // oklch(0.91 0.04 232)
  bgCard:            '#FFFFFF',
  bgOverlay:         'rgba(10, 55, 115, 0.60)',

  brandPrimary:      '#0A6EBD', // oklch(0.48 0.18 240) — Lagoon Blue
  brandSecondary:    '#004F8C', // oklch(0.36 0.16 240) — deep lagoon
  brandAccent:       '#F5A623', // oklch(0.76 0.17 72)  — gold

  textPrimary:       '#0D1B2A', // near-black with blue tint
  textSecondary:     '#2A4A6E', // lagoon dark
  textMuted:         '#7A94B0',
  textOnBrand:       '#FFFFFF',

  success:           '#1DBF73', // oklch(0.65 0.17 158) — emerald
  error:             '#D93025',
  warning:           '#F5A623',
  info:              '#0A6EBD',

  border:            '#C4DCF4',
  divider:           '#DAE8F6',
  inputBg:           '#FFFFFF',
  inputBorder:       '#92BEDD',
  inputBorderFocused:'#0A6EBD',

  energyFill:        '#0A6EBD',
  energyEmpty:       '#C4DCF4',
  xpFill:            '#F5A623',
  xpTrack:           '#FAEBD1',
  streakFlame:       '#FF6B35',
  coinGold:          '#F5A623',

  timerSafe:         '#1DBF73',
  timerWarn:         '#F5A623',
  timerDanger:       '#D93025',
};

// ─────────────────────────────────────────────────────────────────────────────
// Wazobia Theme — Terracotta
// Target: warm terracotta + forest green accent + cream background.
// OKLch targets: primary oklch(0.50 0.19 38), accent oklch(0.52 0.13 155)
// ─────────────────────────────────────────────────────────────────────────────
const wazobia: ThemeTokens = {
  bgPrimary:         '#FDF3EE', // oklch(0.96 0.03 45) — warm cream
  bgSecondary:       '#F5DDD0', // oklch(0.89 0.06 40)
  bgCard:            '#FFF8F4',
  bgOverlay:         'rgba(110, 38, 8, 0.58)',

  brandPrimary:      '#C1440E', // oklch(0.50 0.19 38) — terracotta
  brandSecondary:    '#8B2E00', // oklch(0.37 0.16 35) — burnt sienna
  brandAccent:       '#2D7D46', // oklch(0.52 0.13 155) — forest green

  textPrimary:       '#1C0900',
  textSecondary:     '#5C2A0A',
  textMuted:         '#A07060',
  textOnBrand:       '#FFFFFF',

  success:           '#2D7D46',
  error:             '#B53000',
  warning:           '#E67E22',
  info:              '#C1440E',

  border:            '#E8C5B0',
  divider:           '#F0D5C5',
  inputBg:           '#FFFFFF',
  inputBorder:       '#C89880',
  inputBorderFocused:'#C1440E',

  energyFill:        '#C1440E',
  energyEmpty:       '#E8C5B0',
  xpFill:            '#2D7D46',
  xpTrack:           '#B5D9C0',
  streakFlame:       '#FF6B35',
  coinGold:          '#D4A017',

  timerSafe:         '#2D7D46',
  timerWarn:         '#E67E22',
  timerDanger:       '#B53000',
};

// ─────────────────────────────────────────────────────────────────────────────
// JSS Theme — Teal / Navy (Middle Scholar)
// ─────────────────────────────────────────────────────────────────────────────
const jss: ThemeTokens = {
  bgPrimary:         '#EEF9F9', // soft teal-white
  bgSecondary:       '#CCF0EE',
  bgCard:            '#FFFFFF',
  bgOverlay:         'rgba(0, 65, 75, 0.58)',

  brandPrimary:      '#00838F', // teal
  brandSecondary:    '#005F6B', // dark teal
  brandAccent:       '#FF7043', // warm coral

  textPrimary:       '#002B30',
  textSecondary:     '#00515A',
  textMuted:         '#6AABAF',
  textOnBrand:       '#FFFFFF',

  success:           '#2E7D32',
  error:             '#C62828',
  warning:           '#F9A825',
  info:              '#00838F',

  border:            '#A8DDE0',
  divider:           '#C8EDF0',
  inputBg:           '#FFFFFF',
  inputBorder:       '#7ACDD1',
  inputBorderFocused:'#00838F',

  energyFill:        '#00838F',
  energyEmpty:       '#A8DDE0',
  xpFill:            '#FF7043',
  xpTrack:           '#FFCCBC',
  streakFlame:       '#FF6B35',
  coinGold:          '#F9A825',

  timerSafe:         '#2E7D32',
  timerWarn:         '#F9A825',
  timerDanger:       '#C62828',
};

// ─────────────────────────────────────────────────────────────────────────────
// Primary Theme — Sky Blue (Junior Explorer)
// ─────────────────────────────────────────────────────────────────────────────
const primary: ThemeTokens = {
  bgPrimary:         '#EEF6FF', // soft sky
  bgSecondary:       '#D4EAFF',
  bgCard:            '#FFFFFF',
  bgOverlay:         'rgba(0, 70, 150, 0.48)',

  brandPrimary:      '#1976D2', // bright blue
  brandSecondary:    '#1254A0',
  brandAccent:       '#FFD600', // vivid yellow

  textPrimary:       '#0A1929',
  textSecondary:     '#1A4A90',
  textMuted:         '#6690C8',
  textOnBrand:       '#FFFFFF',

  success:           '#43A047',
  error:             '#E53935',
  warning:           '#FFD600',
  info:              '#1976D2',

  border:            '#B8D9F8',
  divider:           '#D4EAFF',
  inputBg:           '#FFFFFF',
  inputBorder:       '#90C0F0',
  inputBorderFocused:'#1976D2',

  energyFill:        '#1976D2',
  energyEmpty:       '#B8D9F8',
  xpFill:            '#FFD600',
  xpTrack:           '#FFF9C4',
  streakFlame:       '#FF6B35',
  coinGold:          '#FFD600',

  timerSafe:         '#43A047',
  timerWarn:         '#FFD600',
  timerDanger:       '#E53935',
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme map — index by ThemeKey
// ─────────────────────────────────────────────────────────────────────────────
export const Themes: Record<ThemeKey, ThemeTokens> = {
  sss,
  wazobia,
  jss,
  primary,
};

// ─────────────────────────────────────────────────────────────────────────────
// Global / theme-agnostic tokens
// ─────────────────────────────────────────────────────────────────────────────
export const GlobalColors = {
  // Neutral grey scale
  grey50:  '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',

  // Absolute
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // Brand identity (shared across themes, used for global elements)
  sabiGold:    '#F5A623',
  sabiGreen:   '#1DBF73',
  sabiRed:     '#D93025',
  sabiBlue:    '#0A6EBD',

  // Modal / bottom-sheet scrims
  scrim:       'rgba(0, 0, 0, 0.45)',

  // Wazobia Ankara palette accents (used in SVG pattern fill colours)
  ankara: {
    rust:    '#C1440E',
    forest:  '#2D7D46',
    gold:    '#D4A017',
    cream:   '#FDF3EE',
    indigo:  '#3D2B8E',
    coral:   '#E8775A',
    ebony:   '#1A0A00',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Typography scale
// ─────────────────────────────────────────────────────────────────────────────
export const FontSizes = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  hero: 36,
  mega: 48,
} as const;

export const FontFamily = {
  // Space Grotesk — headings, wordmark, display text
  heading:        'SpaceGrotesk_700Bold',
  headingSemi:    'SpaceGrotesk_600SemiBold',
  headingMedium:  'SpaceGrotesk_500Medium',
  headingRegular: 'SpaceGrotesk_400Regular',

  // Inter — body text, labels, UI copy
  body:           'Inter_400Regular',
  bodyMedium:     'Inter_500Medium',
  bodySemiBold:   'Inter_600SemiBold',

  // Source Code Pro — word display, letter dashes, monospaced spelling output
  mono:           'SourceCodePro_400Regular',
} as const;

export const LineHeights = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Spacing scale (4-pt base grid)
// ─────────────────────────────────────────────────────────────────────────────
export const Spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
  huge: 64,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Border radius
// ─────────────────────────────────────────────────────────────────────────────
export const Radii = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    24,
  round: 999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Elevation / shadow presets (cross-platform)
// ─────────────────────────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     3,
  },
  elevated: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius:  12,
    elevation:     6,
  },
  modal: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius:  20,
    elevation:     12,
  },
  button: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius:  4,
    elevation:     2,
  },
} as const;
