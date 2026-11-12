/**
 * Shared validation for farmer text inputs. Import from here, not the files.
 * See validators.ts for the conventions (error = i18n key, blank optional
 * fields pass, numbers validated as exact strings).
 */
export * from './validators';
export * from './validateFields';
export * from './useFieldValidation';
