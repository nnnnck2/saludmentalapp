// ============================================
// MenteSana — Design System "Calm Lagoon"
// Serene teal · Soft neutrals · Professional
// Inspirado en Calm / Headspace / Apple Health
// ============================================

export const COLORS = {
  // Primary — Deep calm teal: confianza, serenidad, profesional
  primary: '#2A9D8F',
  primaryDark: '#1F7A6F',
  primaryDeep: '#14554E',
  primaryLight: '#BFE3DE',
  primaryMist: '#E4F2F0',

  // Secondary — Warm sand: calidez y grounding
  secondary: '#E9C46A',
  secondaryDark: '#C9A24C',
  secondaryMist: '#FBF3DD',

  // Feedback tones — suaves y refinados
  success: '#4C9F87',
  successMist: '#E3F1EC',
  warning: '#D9A441',
  warningMist: '#FAF0DC',
  error: '#C96A5E',
  errorDark: '#A9503F',
  errorMist: '#F9E9E6',
  info: '#5B8FB9',
  infoMist: '#E7F0F7',

  // Backgrounds — cálidos, limpios
  background: '#F6F5F1',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEDE8',
  surfaceMuted: '#F1F0EC',

  // Text — carbón sofisticado
  text: '#22333B',
  textSecondary: '#5C6B70',
  textLight: '#93A2A6',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#E3E0DA',
  divider: '#EAE7E2',

  // Mood spectrum — gradientes suaves (sin emojis)
  moodVeryBad: '#C96A5E',
  moodBad: '#D9A441',
  moodNeutral: '#93B3BD',
  moodGood: '#5FA68F',
  moodVeryGood: '#2A9D8F',

  // Role indicators
  patient: '#2A9D8F',
  psychologist: '#5B8FB9',
  admin: '#8E7CC3',
  guest: '#93A2A6',

  // Crisis — rojo apagado, serio y calmado
  crisis: '#B65C4F',
  crisisDark: '#96493E',
  crisisLight: '#F6E3E0',
} as const;

// Mood scale — descriptive, professional labels (no emojis)
export const MOOD_LABELS: Record<number, string> = {
  1: 'Muy difícil',
  2: 'Difícil',
  3: 'Estable',
  4: 'Bien',
  5: 'En paz',
};

// Mood color scale for visual indicators
export const MOOD_COLORS: Record<number, string> = {
  1: COLORS.moodVeryBad,
  2: COLORS.moodBad,
  3: COLORS.moodNeutral,
  4: COLORS.moodGood,
  5: COLORS.moodVeryGood,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    hero: 34,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#22333B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#22333B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#14554E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Resource type labels (text only — no icons needed)
export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  article: 'Artículo',
  video: 'Video',
  paper: 'Paper',
  podcast: 'Podcast',
  exercise: 'Ejercicio',
};

export const APP_NAME = 'MenteSana';
export const APP_TAGLINE = 'Tu bienestar emocional importa';

export const STORAGE_KEYS = {
  AUTH_SESSION: '@mentesana_auth_session',
  ONBOARDING_DONE: '@mentesana_onboarding_done',
  NOTIFICATIONS_ENABLED: '@mentesana_notifications_enabled',
} as const;

// Status display configuration
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  submitted: 'En revisión',
  reviewed: 'Con comentarios',
  approved: 'Aprobada',
};

export const FORUM_POST_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  moderated: 'Moderado',
  hidden: 'Oculto',
};
