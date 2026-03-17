export const Colors = {
  // Backgrounds
  background: '#080C18',
  surface: '#0F1629',
  surfaceElevated: '#151D35',
  card: '#1A2240',
  cardHighlight: '#1E2A4A',

  // Borders
  border: '#252D47',
  borderLight: '#2D3A5C',

  // Accents
  accent: '#4F8EF7',
  accentDim: '#3A6CC4',
  accentGlow: 'rgba(79, 142, 247, 0.15)',
  cyan: '#2DD4BF',
  violet: '#8B5CF6',
  success: '#22C55E',
  successDim: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.12)',

  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#8A9BC5',
  textMuted: '#4A5978',
  textAccent: '#4F8EF7',

  // Tabs
  tabActive: '#4F8EF7',
  tabInactive: '#4A5978',

  // Time group colors
  timeGroupON_WAKING: '#F59E0B',
  timeGroupPRE_LUNCH: '#22C55E',
  timeGroupPOST_WORKOUT: '#EF4444',
  timeGroupPRE_DINNER: '#2DD4BF',
  timeGroupWITH_EVENING_MEAL: '#8B5CF6',
  timeGroupPRE_BED: '#4F8EF7',
};

export const TIME_GROUP_COLORS: Record<string, string> = {
  'ON WAKING': Colors.timeGroupON_WAKING,
  'PRE-LUNCH': Colors.timeGroupPRE_LUNCH,
  'POST-WORKOUT': Colors.timeGroupPOST_WORKOUT,
  'PRE-DINNER': Colors.timeGroupPRE_DINNER,
  'WITH EVENING MEAL': Colors.timeGroupWITH_EVENING_MEAL,
  'PRE-BED': Colors.timeGroupPRE_BED,
};
