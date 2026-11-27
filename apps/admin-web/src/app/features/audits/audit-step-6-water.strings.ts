/** Strings for inspection step 6, Water Sources & Water pH Testing (design 84). */
export const AUDIT_STEP6_STRINGS = {
  /** Design 84 titles the screen "Water Sources & Water pH Testing" (design 78's card says "Water Source"). */
  TITLE: 'Water Sources & Water pH Testing',
  STEP_PILL: 'Step 6 of 10',
  /** "Water Source 1" */
  sourceBand: (n: number): string => `Water Source ${n}`,
  WATER_SOURCE: 'Water Source',
  USE_PURPOSE: 'Water Use Purpose',
  SOURCE_TYPE: 'Water Source Type',
  VERIFICATION: 'Water Source Verification',
  LOCATION: 'Water Source Location',
  LOCATION_PLACEHOLDER: 'Enter location...',
  CONDITION: 'Water Source Condition',
  TEST_DATE: 'Test Date',
  TEST_METHOD: 'Testing Method',
  INFO_TEXT:
    'Each water source should be recorded and verified separately. Enter the water source details, test date, and testing method for accurate record keeping.',
  ADD_SOURCE: 'Add another water source',
  removeSource: (n: number): string => `Remove water source ${n}`,
  REMOVE: 'Remove',
  sourceAdded: (n: number): string => `Water source ${n} added.`,
  sourceRemoved: (n: number): string => `Water source ${n} removed.`,
} as const;
