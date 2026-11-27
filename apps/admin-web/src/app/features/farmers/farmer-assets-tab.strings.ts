/**
 * UI string catalogue for Farmer Records → Assets (SA-M3-S13) and its Record Service, Edit Asset and
 * Retire Asset modals.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of truth
 * until one exists.
 */
export const FARMER_ASSETS_STRINGS = {
  TITLE: 'Assets',
  SUBTITLE: "View and manage the farmer's assets, equipment and service records.",
  BTN_REGISTER: 'Register Asset',
  REGISTER_NOT_AVAILABLE: 'Not available yet',

  SEARCH_PLACEHOLDER: 'Search assets (e.g. asset name, asset ID, type)...',
  SEARCH_LABEL: 'Search assets',
  FILTERS_LABEL: 'Filter assets',

  PILL_ACTIVE: 'Active',
  PILL_OVERDUE: 'Service overdue',
  PURCHASED: 'Purchased',
  LAST_SERVICE: 'Last service',
  SERVICE_EVERY: 'Service every',
  NEXT_SERVICE_DUE: 'Next service due',
  SOURCE: 'Source',
  NOT_SERVICED: 'Not serviced yet',
  NOT_RECORDED: 'Not recorded',
  ASSET_PHOTO: 'Asset photo placeholder',
  ASSET_DETAILS: 'Asset details',

  BTN_RECORD_SERVICE: 'Record service',
  BTN_EDIT: 'Edit',
  BTN_RETIRE: 'Retire',
  BTN_CLOSE: 'Close',
  BTN_CANCEL: 'Cancel',

  NO_ASSETS: 'No assets have been registered for this farmer yet.',
  NO_MATCHES: 'No assets match your search.',

  // Record Service
  SERVICE_TITLE: 'Record Service',
  SERVICE_DATE: 'Service date (required)',
  SERVICE_TYPE: 'Service type (required)',
  SERVICE_TYPE_PLACEHOLDER: 'Select service type',
  SERVICE_PROVIDER: 'Service provider (optional)',
  SERVICE_PROVIDER_PLACEHOLDER: 'Enter service provider',
  SERVICE_COST: 'Cost (optional)',
  SERVICE_COST_PLACEHOLDER: 'Enter cost amount',
  SERVICE_COST_PREFIX: '₹',
  SERVICE_NOTES: 'Notes (optional)',
  SERVICE_NOTES_PLACEHOLDER: 'Add service details, parts replaced, observations...',
  ATTACHMENT: 'Attachment (optional)',
  ATTACHMENT_TITLE: 'Upload invoice / service receipt',
  ATTACHMENT_HINT: 'Drag & drop file here, or click to select',
  ATTACHMENT_TYPES: 'PDF, JPG, PNG (Max 10 MB)',
  ATTACHMENT_REMOVE: 'Remove attachment',
  ATTACHMENT_ERR_TYPE: 'Only PDF, JPG or PNG files can be attached.',
  ATTACHMENT_ERR_SIZE: 'The file is larger than 10 MB.',
  SERVICE_NOTE: 'Recording service updates the last service date and recalculates the next service due date.',
  BTN_CONFIRM_SERVICE: 'Record Service',
  ERR_SERVICE_DATE_FUTURE: 'The service date cannot be in the future.',

  // Edit Asset
  EDIT_TITLE: 'Edit Asset',
  ASSET_TYPE: 'Asset Type',
  CATEGORY: 'Category',
  SOURCE_FIELD: 'Source',
  SELECT_PLACEHOLDER: 'Select an option',
  ASSET_ID_NOTE: 'Asset ID is system-generated and cannot be changed.',
  BTN_SAVE: 'Save Changes',

  // Retire Asset
  RETIRE_TITLE: 'Retire Asset',
  RETIRE_REASON: 'Reason for retirement',
  RETIRE_REASON_PLACEHOLDER: 'Select a reason',
  RETIRE_REMARKS: 'Remarks',
  RETIRE_REMARKS_PLACEHOLDER: 'Enter the reason for retiring this asset...',
  RETIRE_WARNING: 'This asset will be moved to history and can no longer be edited or serviced.',
  BTN_CONFIRM_RETIRE: 'Retire Asset',

  ERR_REQUIRED: 'This field is required.',

  /** "AST-0001 · Machinery" */
  codeLine: (code: string, category: string) => `${code} · ${category}`,
  assetId: (code: string) => `Asset ID: ${code}`,
  days: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
  /** "2 assets" */
  assetCount: (n: number) => `${n} ${n === 1 ? 'asset' : 'assets'}`,
  addingFor: (name: string, code: string) => (code ? `Adding for ${name} (${code})` : `Adding for ${name}`),
  editingAssetFor: (name: string, code: string) => (code ? `Editing asset for ${name} (${code})` : `Editing asset for ${name}`),
  editingFor: (name: string, code: string) => (code ? `Editing for ${name} (${code})` : `Editing for ${name}`),
  retireSubtitle: (name: string) => `Retire ${name} from the farmer's active asset records.`,
  counter: (n: number, max: number) => `${n} / ${max}`,
  counterAria: (n: number, max: number) => `${n} of ${max} characters used`,
  recordServiceFor: (name: string) => `Record service for ${name}`,
  editFor: (name: string) => `Edit ${name}`,
  retireFor: (name: string) => `Retire ${name}`,
  attachmentChosen: (fileName: string) => `Attached: ${fileName}`,
} as const;
