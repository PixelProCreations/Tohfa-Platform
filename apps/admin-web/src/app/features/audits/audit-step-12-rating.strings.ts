/** Strings for inspection step 12, "Farmer Rating" (design 90). */
export const AUDIT_STEP_12_STRINGS = {
  STEP_PILL: 'Step 12 of 12',

  INFO_AUDIT_ID: 'Audit ID',
  INFO_AUDIT_DATE: 'Audit Date',
  INFO_FARMER: 'Farmer',
  INFO_FARMER_ID: 'Farmer ID',
  INFO_FARM: 'Farm',
  /** "Ramesh Organic Farm - Coonoor, Nilgiris" */
  farmWithLocation: (farm: string, location: string): string =>
    [farm, location].filter((p) => p !== '').join(' - '),
  INFO_LABEL: 'Audit details',

  OVERALL_LABEL: 'OVERALL RATING',
  OVERALL_PENDING: 'Pending',
  /** "74 / 100" */
  overallValue: (sum: number, max: number): string => `${sum} / ${max}`,
  /** "74 / 100 · Good" */
  overallWithTier: (value: string, tier: string): string => `${value} · ${tier}`,
  ratedCount: (n: number, total: number): string => `${n} of ${total} categories rated`,
  previousOverall: (score: number, max: number): string => `Previous overall: ${score} / ${max}`,
  OVERALL_NOTE: 'Overall = the sum of the category scores. No weights, penalties or thresholds are applied.',

  CATEGORIES_HEADING: 'Rating Categories',
  NOT_ASSESSED: 'Not assessed',
  /** "8/10" */
  scoreBadge: (score: number, max: number): string => `${score}/${max}`,
  scoreGroupLabel: (category: string): string => `Score for ${category}, 1 to 10`,
  scoreAria: (score: number, max: number): string => `${score} out of ${max}`,
  NOTES_PLACEHOLDER: 'Notes (optional)',
  notesLabel: (category: string): string => `Notes for ${category} (optional)`,

  FOOTER_NOTE: 'All 10 categories must be rated before final submission.',
  SAVE_DRAFT: 'Save Draft',
  SUBMIT: 'Submit Farmer Rating',
  submitBlocked: (remaining: number): string =>
    `Rate all categories before submitting — ${remaining} still not assessed.`,
} as const;
