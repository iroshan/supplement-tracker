// Database schema types

export interface Supplement {
  id: number;
  name: string;
  dosage: string;
  time_group: string;
  sort_order: number;
  day_restriction: string | null; // e.g. "1,3,5" for Mon/Wed/Fri, null = every day
  active: number; // 1 = active, 0 = inactive
  created_at: string;
}

export interface DailyLog {
  id: number;
  supplement_id: number;
  date: string; // YYYY-MM-DD
  taken: number; // 0 or 1
  taken_at: string | null;
}

export interface AppMeta {
  key: string;
  value: string;
}

// Time groups in display order
export const TIME_GROUPS = [
  'ON WAKING',
  'PRE-LUNCH',
  'POST-WORKOUT',
  'PRE-DINNER',
  'WITH EVENING MEAL',
  'PRE-BED',
] as const;

export type TimeGroup = typeof TIME_GROUPS[number];

export const TIME_GROUP_SUBTITLES: Record<string, string> = {
  'ON WAKING': 'Empty Stomach · ~6:30am',
  'PRE-LUNCH': '30 mins before eating · ~12:00pm',
  'POST-WORKOUT': 'Within 30 mins · Mon / Wed / Fri only',
  'PRE-DINNER': '30 mins before eating · ~5:30pm',
  'WITH EVENING MEAL': '~6:00pm · Must contain fat',
  'PRE-BED': '30–60 mins before sleep · ~9:30pm',
};
