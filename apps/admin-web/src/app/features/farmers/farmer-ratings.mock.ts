/**
 * UI-only placeholder data — replace with API when the ratings tab is integrated.
 *
 * Nothing here comes from docs/openapi.yaml: the API has no farmer-rating endpoints yet, so these
 * interfaces are local to the Ratings tab and the values reproduce the approved design screens.
 * When the tab is integrated, the shapes belong in docs/openapi.yaml first, and the 70/50 score
 * tiers in system_config (root CLAUDE.md §2.7), not here.
 */

/** One of the ten assessment categories, scored 1–10. The overall rating is the sum (out of 100). */
export interface FarmerRatingCategory {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly remarks: string;
}

/** One row of the Rating History card, newest first. */
export interface FarmerRatingHistoryEntry {
  readonly id: string;
  /** Overall rating out of 100. */
  readonly score: number;
  /** ISO date (yyyy-MM-dd). */
  readonly ratedOn: string;
  /** Display text of the previous rating, or null for the first rating. */
  readonly previous: string | null;
  readonly source: string | null;
  readonly ratedBy: string;
}

/** The pre-filled "Rating Update Details" form. */
export interface FarmerRatingUpdateDefaults {
  /** ISO date (yyyy-MM-dd). */
  readonly ratedOn: string;
  readonly source: string;
  readonly ratedBy: string;
  readonly remarks: string;
}

export interface FarmerRatingsMock {
  readonly categories: readonly FarmerRatingCategory[];
  /** Overall rating before the latest update, out of 100. */
  readonly previousOverall: number;
  readonly history: readonly FarmerRatingHistoryEntry[];
  readonly sourceOptions: readonly string[];
  readonly updateDefaults: FarmerRatingUpdateDefaults;
}

/** Highest score a category can take. */
export const RATING_CATEGORY_MAX = 10;
/** Maximum length of every remarks field in the design. */
export const RATING_REMARKS_MAX = 250;
/** Score tiers for colouring an overall rating (placeholder thresholds, out of 100). */
export const RATING_TIER_GOOD = 70;
export const RATING_TIER_FAIR = 50;

export const FARMER_RATINGS_MOCK: FarmerRatingsMock = {
  categories: [
    { id: 'certification', name: 'Certification & Compliance', score: 8, remarks: 'All certifications are valid. Compliance is up to date.' },
    { id: 'soil', name: 'Soil & Land Management', score: 7, remarks: '' },
    { id: 'practices', name: 'Farming Practices', score: 8, remarks: '' },
    { id: 'environment', name: 'Environmental Sustainability', score: 7, remarks: '' },
    { id: 'quality', name: 'Produce Quality & Yield', score: 8, remarks: '' },
    { id: 'traceability', name: 'Traceability & Transparency', score: 9, remarks: '' },
    { id: 'social', name: 'Social & Labor Practices', score: 7, remarks: '' },
    { id: 'financial', name: 'Financial & Operational', score: 8, remarks: '' },
    { id: 'market', name: 'Market & Buyer Relations', score: 8, remarks: '' },
    { id: 'innovation', name: 'Innovation & Improvement', score: 8, remarks: '' },
  ],
  previousOverall: 68,
  history: [
    { id: 'h2', score: 75, ratedOn: '2026-08-01', previous: '2.5', source: 'Audit assessment', ratedBy: 'Auditor' },
    { id: 'h1', score: 72, ratedOn: '2026-02-02', previous: null, source: null, ratedBy: 'Priya Nair' },
  ],
  sourceOptions: ['Audit assessment', 'Field inspection', 'Periodic review', 'Buyer feedback', 'Certification renewal'],
  updateDefaults: {
    ratedOn: '2026-08-01',
    source: 'Audit assessment',
    ratedBy: 'Super Admin',
    remarks: 'Annual audit completed. Overall performance improved in compliance and traceability.',
  },
};
