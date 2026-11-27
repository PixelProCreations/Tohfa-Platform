/**
 * UI string catalogue for the Edit Farmer Profile screen (SA-M3-S02a).
 *
 * Same convention as farmers.strings.ts: the admin console has no i18n framework yet, so this
 * catalogue is the single source of truth for the screen's user-facing English (root CLAUDE.md §2.7).
 * Field labels follow the farmer application (mobile registration step 1 / step 2), whose field set
 * this screen edits.
 */
export const FARMER_EDIT_STRINGS = {
  TITLE: 'Edit Farmer Profile',
  SUBTITLE: "Update the farmer's details, farm information, land, banking and certification.",
  BTN_CANCEL: 'Cancel',
  BTN_SAVE: 'Save Changes',
  BTN_SAVING: 'Saving…',
  LOADING: 'Loading farmer…',
  NOT_FOUND: 'This farmer does not exist or is outside your scope.',
  LOAD_ERROR: 'Could not load this farmer. Please try again.',
  RETRY: 'Retry',
  BACK_TO_DIRECTORY: 'Back to Farmer Directory',

  /** Tooltip on a control the design shows but no admin endpoint can save. */
  NOT_AVAILABLE_YET: 'Not available yet',
  /** Tooltip on a value collected in the farmer application that the admin profile API neither returns nor edits. */
  NOT_IN_PROFILE_API: 'Not available yet: collected in the farmer application, not editable through the farmer profile API',

  SAVE_SUCCESS: 'Farmer profile updated.',
  SAVE_ERROR: 'The changes were not saved. Please try again.',
  SAVE_INVALID: 'Please correct the highlighted fields.',
  SAVE_NOT_FOUND: 'This farmer no longer exists or is outside your scope.',
  SAVE_FORBIDDEN: 'Your role cannot edit this farmer profile.',
  SAVE_FIELD_LOCKED: 'Mobile and Aadhaar may only be changed by a Super Admin.',
  MOBILE_TAKEN: 'That mobile number already belongs to another account.',

  // ---------- Personal Details ----------
  PERSONAL_DETAILS: 'Personal Details',
  FULL_NAME: 'Full Name',
  FULL_NAME_PLACEHOLDER: 'Enter full name',
  FARMER_ID: 'Farmer ID',
  FARMER_ID_LOCKED: 'Assigned by TOHFA; cannot be changed',
  MOBILE: 'Mobile Number',
  MOBILE_PLACEHOLDER: 'Enter 10-digit mobile number',
  MOBILE_LOCKED: 'Locked field (BR-33): only a Super Admin can change the mobile number',
  ALTERNATE_MOBILE: 'Alternate Mobile',
  ALTERNATE_MOBILE_PLACEHOLDER: 'Enter alternate number',
  EMAIL: 'Email Address',
  EMAIL_PLACEHOLDER: 'Enter email address',
  GENDER: 'Gender',
  GENDER_PLACEHOLDER: 'Select gender',
  GENDER_OPTIONS: {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
    UNDISCLOSED: 'Prefer not to say',
  },
  DOB: 'Date of Birth',
  FARMING_METHOD: 'Farming Method',
  /** The application's step-2 `typeOfFarming` options (mobile Step2FarmDetails FARMING_TYPES). */
  FARMING_METHOD_OPTIONS: ['Natural', 'Organic', 'Bio-dynamic', 'Others'],
  SELECT_PLACEHOLDER: 'Select',
  EXPERIENCE: 'Experience (Years)',
  EXPERIENCE_PLACEHOLDER: 'Years of farming',
  PRIMARY_CROPS: 'Primary Crops',
  FARMER_TYPE: 'Farmer Type',
  LANGUAGE: 'Language Preference',
  /** The application's `preferredLocale` values, en and ta. */
  LANGUAGE_OPTIONS: ['English', 'Tamil'],
  COMMUNICATION: 'Preferred Communication',

  // ---------- Address Details ----------
  ADDRESS_DETAILS: 'Address Details',
  VILLAGE: 'Village',
  VILLAGE_PLACEHOLDER: 'Enter village',
  TALUK: 'Taluk',
  TALUK_PLACEHOLDER: 'Enter taluk',
  ZONE: 'Zone',
  ZONE_LOCKED: 'Not available yet: the farmer profile API does not change a farmer’s zone',
  ZONE_NONE: 'No zone',
  DISTRICT: 'District',
  /** The application's district picker (mobile step 1 AddressSection DISTRICT_OPTIONS). */
  DISTRICT_OPTIONS: [
    'The Nilgiris',
    'Coimbatore',
    'Erode',
    'Tiruppur',
    'Salem',
    'Madurai',
    'Thanjavur',
    'Tiruchirappalli',
    'Chennai',
    'Dharmapuri',
  ],
  STATE: 'State',
  ADDRESS: 'Address',
  ADDRESS_PLACEHOLDER: 'House / street, village, landmark',
  counter: (used: number, max: number): string => `${used} / ${max}`,
  PINCODE: 'Pincode',
  PINCODE_PLACEHOLDER: '6-digit PIN code',

  // ---------- Farmer Photo ----------
  FARMER_PHOTO: 'Farmer Photo',
  PHOTO_ALT: 'Farmer profile photo',
  UPLOAD_PHOTO: 'Upload Profile Photo',
  PHOTO_HINT: 'JPG, PNG (Max 5 MB)',
  CHOOSE_FILE: 'Choose File',
  REMOVE: 'Remove',
  PHOTO_NOT_AVAILABLE: 'Not available yet: there is no admin endpoint to replace or remove a farmer’s photo',

  // ---------- Identity & Verification ----------
  IDENTITY: 'Identity & Verification',
  AADHAAR: 'Aadhaar Number',
  AADHAAR_NONE: 'Not recorded',
  aadhaarMasked: (last4: string): string => `XXXX XXXX ${last4}`,
  AADHAAR_REVEAL: 'Only the last four digits are stored (BR-33b); the full number cannot be shown',
  PAN: 'PAN (Optional)',
  PAN_PLACEHOLDER: 'Enter PAN number',
  KYC_STATUS: 'KYC Status',
  KYC_OPTIONS: { VERIFIED: 'Verified', PENDING: 'Pending', REJECTED: 'Rejected' },

  // ---------- Farm Location ----------
  FARM_LOCATION: 'Farm Location',
  MAP_TITLE: 'Farm location map',
  MAP_OR: 'or ',
  MAP_BROWSE: 'browse files',
  ZOOM_IN: 'Zoom in',
  ZOOM_OUT: 'Zoom out',
  COORDINATES: 'Coordinates: ',
  NO_COORDINATES: 'No GPS coordinates recorded',
  latLng: (lat: number, lng: number): string =>
    `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`,
  UPDATE_LOCATION: 'Update Location',
  EDIT_ON_MAP: 'Edit on Map',
  LOCATION_NOT_AVAILABLE: 'Not available yet: land locations are edited by the farmer (PATCH /farms/{farmId}); there is no admin endpoint',

  // ---------- Validation (mirrors PATCH /admin/farmers/{id} and the application's step-1 rules) ----------
  ERR_REQUIRED: 'This field is required.',
  ERR_FULL_NAME: 'Enter 2 to 120 characters.',
  ERR_EMAIL: 'Enter a valid email address.',
  ERR_DOB: 'Enter a real date that is not in the future.',
  ERR_EXPERIENCE: 'Enter whole years between 0 and 120.',
  ERR_MOBILE: 'Enter a 10-digit Indian mobile number starting with 6–9.',
  ERR_PINCODE: 'Enter a 6-digit PIN code not starting with 0.',
  errMax: (max: number): string => `At most ${max} characters.`,

  // ---------- Leave guard ----------
  LEAVE_TITLE: 'Discard unsaved changes?',
  LEAVE_BODY: 'Your edits to this farmer profile have not been saved.',
  LEAVE_STAY: 'Keep editing',
  LEAVE_DISCARD: 'Discard changes',
  LEAVE_CONFIRM: 'Your edits to this farmer profile have not been saved. Leave this page?',
} as const;
