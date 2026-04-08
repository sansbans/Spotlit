export interface Patch {
  id: string;
  name: string;
  bodyLocation: string;
  coverPhoto: string | null;
  stressor: string;
  cause: string;
  medication: string;
  startDate: string; // YYYY-MM-DD
  targetDays: number; // default 60
  notes: string;
  isActive: boolean;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  patchId: string;
  date: string; // YYYY-MM-DD
  photo: string | null; // URI — the timelapse frame
  ointmentApplied: boolean;
  ointmentName: string;
  applicationTime: string; // HH:MM
  notes: string;
  dayNumber: number; // day 1 to targetDays
  progress: 'improving' | 'same' | 'worsening';
  createdAt: string;
}

export interface PatchStats {
  currentStreak: number;
  longestStreak: number;
  totalLogged: number;
  progressPercent: number;
  lastLogDate: string | null;
  loggedToday: boolean;
}

export interface PatchWithStats extends Patch {
  stats: PatchStats;
  logs: DailyLog[];
}

export type ProgressMood = 'improving' | 'same' | 'worsening';

export const BODY_LOCATIONS = [
  'Face',
  'Neck',
  'Scalp',
  'Chest',
  'Back',
  'Shoulders',
  'Upper Arm',
  'Forearm',
  'Hand',
  'Fingers',
  'Abdomen',
  'Hip',
  'Thigh',
  'Knee',
  'Lower Leg',
  'Foot',
  'Other',
] as const;

export const COMMON_STRESSORS = [
  'Emotional Stress',
  'Physical Injury (Koebner)',
  'Sunburn',
  'Chemical Exposure',
  'Illness / Infection',
  'Hormonal Changes',
  'Autoimmune Trigger',
  'Unknown',
  'Other',
] as const;

export const COMMON_MEDICATIONS = [
  'Tacrolimus (Protopic) 0.1%',
  'Tacrolimus (Protopic) 0.03%',
  'Pimecrolimus (Elidel)',
  'Betamethasone',
  'Mometasone',
  'Clobetasol Propionate',
  'Ruxolitinib (Opzelura)',
  'Phototherapy (NB-UVB)',
  'Vitamin D Cream',
  'Natural / No medication',
  'Other',
] as const;
