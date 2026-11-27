/** Strings for inspection step 9, "Farmer Admin Assessment" (design 87). */
export const AUDIT_STEP_9_STRINGS = {
  STEP_PILL: 'Step 9 of 10',
  CARD_TITLE: 'Farmer Admin Assessment',

  LABEL_OVERALL: 'Overall Assessment',
  LABEL_RECOMMENDATION: 'Recommendation',
  LABEL_STRENGTHS: 'Strengths Observed',
  LABEL_REMARKS: 'Supporting Remarks',
  LABEL_FOLLOW_UP: 'Follow-up Required',
  LABEL_SCORE: 'Official Audit Score',
  SCORE_LOCKED_HINT: 'Read-only. Set by the Farmer Rating step.',
  SCORE_NOT_SCORED: 'Not scored yet',

  PLACEHOLDER_SELECT: 'Select…',
  PLACEHOLDER_STRENGTHS: 'Enter strengths observed…',
  PLACEHOLDER_REMARKS: 'Enter supporting remarks…',

  // ---------- Overall assessment (design-implied) ----------
  OVERALL_SATISFACTORY: 'Satisfactory',
  OVERALL_NEEDS_IMPROVEMENT: 'Needs improvement',
  OVERALL_UNSATISFACTORY: 'Unsatisfactory',

  // ---------- Recommendation (design-implied) ----------
  RECOMMEND_CONTINUE: 'Continue as certified organic farmer',
  RECOMMEND_CORRECTIVE_PLAN: 'Continue with corrective action plan',
  RECOMMEND_RE_AUDIT: 'Schedule a re-audit',
  RECOMMEND_RED_FLAG_REVIEW: 'Refer for red-flag review',

  // ---------- Follow-up required ----------
  FOLLOW_UP_YES: 'Yes',
  FOLLOW_UP_NO: 'No',

  ERROR_OVERALL_REQUIRED: 'Select an overall assessment.',
  errorSummary: (n: number): string =>
    `${n} required field${n === 1 ? ' is' : 's are'} missing. Fix the highlighted field${n === 1 ? '' : 's'} to continue.`,
} as const;
