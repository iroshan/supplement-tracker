import { Supplement, TimeGroup } from './schema';

// Seed data - full supplement protocol
export const SEED_SUPPLEMENTS: Omit<Supplement, 'id' | 'created_at'>[] = [
  // ON WAKING
  { name: 'BHB Salts (Peach Mango)', dosage: '½ scoop', time_group: 'ON WAKING', sort_order: 1, day_restriction: null, active: 1 },
  { name: 'Creatine Monohydrate', dosage: '5g', time_group: 'ON WAKING', sort_order: 2, day_restriction: null, active: 1 },
  { name: 'L-Glutamine', dosage: '5g', time_group: 'ON WAKING', sort_order: 3, day_restriction: null, active: 1 },
  { name: 'EAAs', dosage: '10g', time_group: 'ON WAKING', sort_order: 4, day_restriction: null, active: 1 },
  { name: 'Methylated B-Complex', dosage: '1 tablet', time_group: 'ON WAKING', sort_order: 5, day_restriction: null, active: 1 },
  { name: 'Bio-Kult Probiotic', dosage: '1 capsule', time_group: 'ON WAKING', sort_order: 6, day_restriction: null, active: 1 },

  // PRE-LUNCH
  { name: 'Glucomannan Complex', dosage: 'Per label + 400ml water min.', time_group: 'PRE-LUNCH', sort_order: 1, day_restriction: null, active: 1 },
  { name: 'Berberine HCl', dosage: '500mg', time_group: 'PRE-LUNCH', sort_order: 2, day_restriction: null, active: 1 },
  { name: 'Plant Sterols', dosage: '800mg (1 tablet)', time_group: 'PRE-LUNCH', sort_order: 3, day_restriction: null, active: 1 },
  { name: 'CLA Softgel', dosage: '1000mg (1 softgel)', time_group: 'PRE-LUNCH', sort_order: 4, day_restriction: null, active: 1 },
  { name: 'PepZin GI', dosage: '1 capsule (at start of meal)', time_group: 'PRE-LUNCH', sort_order: 5, day_restriction: null, active: 1 },

  // POST-WORKOUT (Mon/Wed/Fri only — day_restriction: "1,3,5")
  { name: 'Grenade Whey Protein', dosage: '30g', time_group: 'POST-WORKOUT', sort_order: 1, day_restriction: '1,3,5', active: 1 },

  // PRE-DINNER
  { name: 'Berberine HCl', dosage: '500mg', time_group: 'PRE-DINNER', sort_order: 1, day_restriction: null, active: 1 },
  { name: 'Plant Sterols', dosage: '800mg × 2 tablets (1.6g)', time_group: 'PRE-DINNER', sort_order: 2, day_restriction: null, active: 1 },

  // WITH EVENING MEAL
  { name: 'Omega 800 (KD-Pur)', dosage: '2–3 softgels', time_group: 'WITH EVENING MEAL', sort_order: 1, day_restriction: null, active: 1 },
  { name: 'Vitamin D3 + K2 (MK-7)', dosage: '1 serving', time_group: 'WITH EVENING MEAL', sort_order: 2, day_restriction: null, active: 1 },
  { name: 'CoQ10', dosage: '100mg', time_group: 'WITH EVENING MEAL', sort_order: 3, day_restriction: null, active: 1 },
  { name: 'KSM-66 Ashwagandha', dosage: '1 capsule (evening only)', time_group: 'WITH EVENING MEAL', sort_order: 4, day_restriction: null, active: 1 },
  { name: 'NAC', dosage: '700mg', time_group: 'WITH EVENING MEAL', sort_order: 5, day_restriction: null, active: 1 },
  { name: 'Vitamin C 1000mg (Rosehip + Bioflavonoids)', dosage: '1 tablet', time_group: 'WITH EVENING MEAL', sort_order: 6, day_restriction: null, active: 1 },
  { name: 'Odourless Garlic', dosage: '1 capsule', time_group: 'WITH EVENING MEAL', sort_order: 7, day_restriction: null, active: 1 },
  { name: 'Curcumin Phytosome', dosage: '500mg', time_group: 'WITH EVENING MEAL', sort_order: 8, day_restriction: null, active: 1 },
  { name: 'Zinc Bisglycinate', dosage: '15–25mg', time_group: 'WITH EVENING MEAL', sort_order: 9, day_restriction: null, active: 1 },

  // PRE-BED
  { name: 'Magnesium Glycinate', dosage: '2–3 capsules (330–500mg elemental)', time_group: 'PRE-BED', sort_order: 1, day_restriction: null, active: 1 },
  { name: 'Glycine', dosage: '3g (1.5 tsp) in warm water', time_group: 'PRE-BED', sort_order: 2, day_restriction: null, active: 1 },
  { name: 'Apigenin', dosage: '50mg', time_group: 'PRE-BED', sort_order: 3, day_restriction: null, active: 1 },
  { name: 'L-Theanine (optional)', dosage: '200mg', time_group: 'PRE-BED', sort_order: 4, day_restriction: null, active: 1 },
];
