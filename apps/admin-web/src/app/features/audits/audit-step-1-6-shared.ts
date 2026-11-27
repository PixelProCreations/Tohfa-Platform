/**
 * Helpers shared by inspection steps 1–6 (designs 79–84). UI ONLY — no HTTP.
 *
 * - `auditStepRouteId()` reads the `:id` route param with the module's default audit as fallback.
 * - `auditStepFileError()` is the local PDF / JPG / PNG, 10 MB check the drop zones run before
 *   showing a chosen file. Nothing is uploaded; when integrated, the server re-validates (and strips
 *   EXIF, BR-16) on `POST /uploads`.
 * - `AUDIT_STEPS_1_6_STYLES` adds the few rules these screens need on top of AUDIT_SHARED_STYLES
 *   (two-column layout, inset card header strip, muted select placeholder, error summary, locked
 *   key/value rows, info note). Theme variables only.
 */
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AUDIT_ROUTE_PARAMS } from './audit-nav';

/** The audit the step screens open when the route carries no id (designs 79–83). */
export const AUDIT_STEP_DEFAULT_AUDIT_ID = 'AUD-2026-0042';

/** Total steps shown in the step pill ("Step 2 of 10"), as drawn in designs 79–84. */
export const AUDIT_STEP_PILL_TOTAL = 10;

/** Notes / textarea limit drawn as "0 / 500" in the designs. */
export const AUDIT_STEP_NOTES_MAX = 500;

/** Local file checks for the drop zones (designs: "PDF, JPG, PNG (Max 10 MB)"). */
export const AUDIT_STEP_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const AUDIT_STEP_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png'];

export type AuditStepFileError = 'type' | 'size';

export function auditStepFileError(file: { name: string; type: string; size: number }): AuditStepFileError | null {
  const ext = file.name.includes('.') ? (file.name.split('.').pop() ?? '').toLowerCase() : '';
  // Some browsers report an empty MIME type; fall back to the extension then.
  const typeOk = file.type !== '' ? ALLOWED_MIME.includes(file.type) : ALLOWED_EXT.includes(ext);
  if (!typeOk || !ALLOWED_EXT.includes(ext)) return 'type';
  if (file.size > AUDIT_STEP_FILE_MAX_BYTES) return 'size';
  return null;
}

/** A native `<select>` option. `value` is the API enum value where one exists. */
export interface AuditStepOption {
  readonly value: string;
  readonly label: string;
}

/** A file chosen locally in a drop zone (never uploaded). */
export interface AuditStepLocalFile {
  readonly name: string;
  readonly sizeBytes: number;
}

/**
 * Subscribes to the `:id` route param (fallback AUDIT_STEP_DEFAULT_AUDIT_ID) for the lifetime of
 * the calling component. Call from a constructor / field initialiser (injection context).
 */
export function auditStepRouteId(onId: (id: string) => void): void {
  const route = inject(ActivatedRoute);
  const destroyRef = inject(DestroyRef);
  route.paramMap.pipe(takeUntilDestroyed(destroyRef)).subscribe((params) => {
    const id = params.get(AUDIT_ROUTE_PARAMS.id);
    onId(id !== null && id.trim() !== '' ? id : AUDIT_STEP_DEFAULT_AUDIT_ID);
  });
}

/** Label for an option value, or '' when unset / unknown. */
export function auditStepOptionLabel(options: readonly AuditStepOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? '';
}

/**
 * Focuses the first element with `aria-invalid="true"` inside `root`, after the current change
 * detection pass has rendered the invalid state.
 */
export function auditStepFocusFirstInvalid(root: HTMLElement): void {
  setTimeout(() => {
    const el = root.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
  });
}

export const AUDIT_STEPS_1_6_STYLES = `
  .step-cols {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-16);
    align-items: start;
  }
  .step-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
    min-width: 0;
  }
  /* Designs 79–84 draw the tinted header as a rounded strip inset in the card. */
  .step-card {
    padding: var(--space-12);
  }
  .step-card > .audit-card-head {
    border-radius: var(--r-sm);
  }
  .step-card > .step-card-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    padding: var(--space-14) var(--space-4) var(--space-4);
  }
  .step-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
  }
  select.audit-control.is-placeholder {
    color: var(--tohfa-muted);
  }
  select.audit-control option {
    color: var(--tohfa-ink);
  }
  .step-error-summary {
    margin: 0;
    padding: var(--space-10) var(--space-14);
    border: 1px solid var(--err-bd);
    border-radius: var(--r-sm);
    background: var(--err-bg);
    color: var(--err);
    font-size: var(--fs-dense);
    font-weight: var(--fw-semi);
  }
  .step-error-summary ul {
    margin: var(--space-6) 0 0;
    padding-left: var(--space-20);
  }
  .step-error-summary a {
    color: inherit;
  }
  .step-kv-row {
    align-items: center;
    padding: var(--space-4) 0;
  }
  .step-kv-row .audit-kv-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-4);
    font-weight: var(--fw-bold);
    color: var(--tohfa-ink);
  }
  .step-lock {
    font-size: var(--icon-row-action);
    color: var(--tohfa-slate);
  }
  .step-note-info {
    display: flex;
    align-items: flex-start;
    gap: var(--space-8);
    margin: 0;
    padding: var(--space-10) var(--space-12);
    border: 1px solid var(--info-bd);
    border-radius: var(--r-sm);
    background: var(--info-bg);
    color: var(--info);
    font-size: var(--fs-cap);
    font-weight: var(--fw-semi);
  }
  .step-note-info .material-symbols-outlined {
    font-size: var(--icon-row-action);
  }
  .step-inline-link {
    padding: 0;
    border: none;
    background: none;
    color: var(--info);
    font: inherit;
    text-decoration: underline;
    cursor: default;
  }
  .step-inline-link:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .step-doc-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-10);
    padding: var(--space-10) var(--space-12);
    border: var(--border-card);
    border-radius: var(--r-sm);
    background: var(--tohfa-surface);
  }
  .step-doc-name {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    min-width: 0;
    font-size: var(--fs-dense);
  }
  .step-doc-name .material-symbols-outlined {
    color: var(--tohfa-amber);
  }
  .step-doc-title {
    display: block;
    font-weight: var(--fw-bold);
    color: var(--tohfa-ink);
  }
  .step-doc-sub {
    display: block;
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
  }
  .step-view-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-4);
    min-height: calc(var(--space-16) * 2);
    padding: var(--space-4) var(--space-12);
    border: 1px solid var(--tohfa-amber);
    border-radius: var(--tohfa-radius-button);
    background: var(--tohfa-surface);
    color: var(--tohfa-brown);
    font-family: var(--font);
    font-size: var(--fs-dense);
    font-weight: var(--fw-bold);
    cursor: default;
  }
  .step-view-btn:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .step-view-btn .material-symbols-outlined {
    font-size: var(--icon-row-action);
  }
  .step-section-label {
    margin: 0;
    font-size: var(--fs-dense);
    font-weight: var(--fw-bold);
    color: var(--tohfa-brown);
  }
  @media (max-width: 900px) {
    .step-cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;
