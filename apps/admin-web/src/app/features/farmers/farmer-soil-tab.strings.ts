/**
 * UI string catalogue for the Soil tab of the Farmer Details screen.
 *
 * Same convention as farmers.strings.ts: the admin console has no i18n framework yet, so this
 * catalogue is the single source of truth for the tab's user-facing English (root CLAUDE.md §2.7).
 */
export const FARMER_SOIL_TAB_STRINGS = {
  NOT_AVAILABLE_YET: 'Not available yet',
  /**
   * Tooltip on every soil-test value. The soil diary endpoints (`/farms/{farmId}/plots/{plotId}/soil-*`)
   * are `farmer.soil.manage_own`, which no admin role holds; docs/openapi.yaml has no admin read.
   */
  NO_ADMIN_SOIL_API: 'Not available yet — soil test records have no admin API',
  LOADING: 'Loading soil details…',
  LOAD_ERROR: 'Could not load this farmer’s soil details. Please try again.',
  NO_ACCESS: 'You do not have permission to view this farmer’s profile.',
  RETRY: 'Retry',
  EMPTY_VALUE: '—',

  // Summary tiles
  STAT_SOIL_RECORDS: 'Soil Records',
  STAT_TESTS_COMPLETED: 'Soil Tests Completed',
  STAT_LAST_TEST: 'Last Soil Test',
  STAT_OVERALL_HEALTH: 'Overall Soil Health',

  // Soil Health Overview
  OVERVIEW_TITLE: 'Soil Health Overview',
  SCORE_OUT_OF: '/ 100',
  SCORE_LABEL: 'Soil Health Score',
  SCORE_ARIA_EMPTY: 'Soil health score not available',
  SOIL_TYPE: 'Soil Type',
  SOIL_TYPE_HINT: 'Soil types recorded on this farmer’s plots',
  SOIL_TYPE_NONE: 'Not recorded',
  TEXTURE: 'Texture',
  PH_LATEST: 'pH (Latest)',
  ORGANIC_CARBON: 'Organic Carbon',
  EC: 'EC (Electrical Conductivity)',
  LAST_TESTED_ON: 'Last Tested On',

  // Nutrient levels
  NUTRIENTS_TITLE: 'Soil Nutrient Levels',
  NUTRIENTS_SUBTITLE: '(Latest Test)',
  NUTRIENT_N: 'N',
  NUTRIENT_N_NAME: 'Nitrogen',
  NUTRIENT_P: 'P',
  NUTRIENT_P_NAME: 'Phosphorus',
  NUTRIENT_K: 'K',
  NUTRIENT_K_NAME: 'Potassium',
  NUTRIENT_OC: 'OC',
  NUTRIENT_OC_NAME: 'Organic Carbon',

  // Test history
  HISTORY_TITLE: 'Soil Test History',
  COL_TEST_ID: 'Test ID',
  COL_DATE: 'Date',
  COL_PH: 'pH',
  COL_EC: 'EC',
  COL_ORG_CARBON: 'Org. Carbon',
  COL_N: 'N',
  COL_P: 'P',
  COL_K: 'K',
  COL_HEALTH: 'Health',
  HISTORY_EMPTY: 'No soil test records available. Soil tests are not yet readable from the admin console.',

  // Recommendations
  RECOMMENDATIONS_TITLE: 'Soil Recommendations',
  RECOMMENDATIONS_EMPTY_TITLE: 'No recommendations',
  RECOMMENDATIONS_EMPTY_BODY:
    'Soil recommendations are not generated yet. Automated advisory content is on hold (BR-38).',
} as const;
