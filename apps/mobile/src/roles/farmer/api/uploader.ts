/**
 * Moved to src/shell/uploads/uploader.ts so every role (customer support
 * photos, admin documents) shares one resumable uploader. Re-exported here so
 * existing farmer imports and `vi.mock('../api/uploader')` keep working.
 */
export {
  uploadWithResume,
  getUploadSession,
  clearUploadSession,
  resetAllUploadSessions,
  type UploadOptions,
  type UploadResult,
  type UploadSessionState,
} from '../../../shell/uploads/uploader';
