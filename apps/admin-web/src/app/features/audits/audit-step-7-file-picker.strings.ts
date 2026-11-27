/** Strings for AuditStepFilePickerComponent (local file chooser shared by steps 7, 8, 10 and 11). */
export const AUDIT_FILE_PICKER_STRINGS = {
  ERROR_TYPE: 'Unsupported file type. Choose a PDF, JPG or PNG file.',
  ERROR_SIZE: 'File is too large. The maximum size is 10 MB.',
  REMOVE: 'Remove file',
  removeAria: (name: string): string => `Remove file ${name}`,
  SELECTED: 'Selected file',
  /** Size for the file chip ("850 KB", "2.4 MB"). */
  size: (bytes: number): string =>
    bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(Math.round((bytes / (1024 * 1024)) * 10) / 10).toString()} MB`,
} as const;
