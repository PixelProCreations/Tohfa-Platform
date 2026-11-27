/**
 * Strings shared by inspection steps 1–6 (designs 79–84): placeholders, the error summary, file
 * picker messages and the notes counter. Step-specific labels live in each step's own
 * `audit-step-<n>-*.strings.ts`; module-wide labels (section titles, shell buttons) in
 * audit.strings.ts.
 */
export const AUDIT_STEP_COMMON_STRINGS = {
  SELECT_PLACEHOLDER: 'Select...',
  NOTES_PLACEHOLDER: 'Enter verification notes, observations, or remarks...',
  READ_ONLY: 'Read only',
  LOCKED: 'Locked — read only',
  VIEW: 'View',
  NOT_AVAILABLE_YET: 'Not available yet',
  /** "0 / 500" */
  counter: (used: number, max: number): string => `${used} / ${max}`,
  counterLabel: (used: number, max: number): string => `${used} of ${max} characters used`,

  // ---------- Validation ----------
  REQUIRED_SELECT: 'Select an option.',
  errorSummaryAnnounce: (n: number): string =>
    `${n} required field${n === 1 ? ' is' : 's are'} missing. Fix the highlighted field${n === 1 ? '' : 's'} to continue.`,

  // ---------- File picker (local only — nothing is uploaded) ----------
  DROP_TEXT_PREFIX: 'Drag & drop file here or',
  DROP_TEXT_PREFIX_PLURAL: 'Drag & drop files here or',
  BROWSE_FILE: 'Browse file',
  BROWSE_FILES: 'Browse files',
  DROP_HINT: 'Supported formats: PDF, JPG, PNG (Max 10 MB)',
  DROP_HINT_SHORT: 'PDF, JPG, PNG (Max 10 MB)',
  UPLOAD_FILE: 'Upload file',
  FILE_ERROR_TYPE: 'Unsupported file type. Choose a PDF, JPG or PNG file.',
  FILE_ERROR_SIZE: 'File is larger than 10 MB. Choose a smaller file.',
  REMOVE_FILE: 'Remove',
  removeFileLabel: (name: string): string => `Remove ${name}`,
  FILE_LOCAL_NOTE: 'Selected locally — not uploaded (demo).',
  /** "2.4 MB" / "860 KB" */
  fileSize: (bytes: number): string =>
    bytes >= 1024 * 1024
      ? `${(Math.round((bytes / (1024 * 1024)) * 10) / 10).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`,
} as const;
