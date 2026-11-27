/**
 * Shared styles for the Audit Management module. Every audit component lists it first in `styles`:
 *
 *   styles: [AUDIT_SHARED_STYLES, `...screen-specific rules...`]
 *
 * Angular encapsulates component styles, so this string is compiled into each component that lists it
 * (and also styles content that component projects into <tohfa-audit-step-shell>, because projected
 * markup belongs to the projecting component). Theme variables only — theme.css and
 * tokens.generated.css. No colour literals, no raw spacing.
 *
 * Global theme.css classes are reused rather than redefined: `tohfa-card`, `tohfa-btn`,
 * `tohfa-btn-primary`, `tohfa-kpi-card`, `tohfa-kpi-label`, `tohfa-kpi-val`, `tohfa-badge`,
 * `tohfa-badge-{info|warning|success|danger|purple|neutral|amber-tint}`, `tohfa-badge-sm`,
 * `tohfa-input`, `tohfa-label`, `tohfa-label-required`, `tohfa-tabs`, `tohfa-tab-pill`,
 * `tohfa-banner-*`. Status pills: use `auditStatusPillClass(status)` from audit-presentation.ts.
 *
 * CLASS API (prefix `audit-` everywhere so screen-specific rules never collide):
 *
 * Utilities
 *   .icon                     Material Symbols glyph at button size (add to `material-symbols-outlined`)
 *   .sr-only                  visually hidden, read by screen readers
 *   .tone-fg-{info|warning|success|danger|purple|neutral|amber|brown}   text colour only
 *   .tone-bg-{info|warning|success|danger|purple|neutral|amber}         tint background + colour
 *
 * Page chrome
 *   .audit-page-header        flex row: title block left, actions right
 *   .audit-title-row          flex row holding icon/tile + <h1>
 *   .audit-title              the <h1> (22px, extrabold)
 *   .audit-title-icon         inline glyph before the title (shield in designs 74/75)
 *   .audit-title-tile         tinted square icon tile before the title (step screens, 76–78)
 *   .audit-subtitle           slate line under the title
 *   .audit-meta-row           inline row under the title: "AUD-… · Name" + pills
 *   .audit-header-actions     right-side group of round icon buttons
 *   .audit-icon-btn           round bordered icon button; child .audit-icon-btn-badge = count bubble
 *   .audit-section-title      amber section heading ("Inspection sections", "Rating Categories")
 *
 * KPI row
 *   .audit-kpis               6-column grid (3 at ≤1200px, 2 at ≤640px)
 *   .audit-kpi                add to `tohfa-kpi-card`; children .audit-kpi-top (value + icon row),
 *                             .audit-kpi-value, .audit-kpi-label, .audit-kpi-icon (+ .tone-fg-*)
 *
 * Cards
 *   .audit-card               white bordered card with no padding (use with header + body)
 *   .audit-card-head          "card with a tinted header strip": amber tint, brown bold title, icon
 *   .audit-card-body          padded body; .audit-card-body.tight = smaller padding
 *   .audit-card-title         amber card heading without a strip ("09 Oct 2026")
 *   .audit-grid-2 / .audit-grid-3 / .audit-grid-4   responsive card / field grids
 *
 * Label / value
 *   .audit-kv                 vertical list of rows; .audit-kv-row = label left, value right;
 *                             .audit-kv-label (slate), .audit-kv-value (ink, bold, right-aligned)
 *   .audit-summary            horizontal strip of icon + label + value items (designs 77, 78, 90);
 *                             .audit-summary-item, .audit-summary-icon, .audit-summary-label,
 *                             .audit-summary-value
 *
 * Pills
 *   .audit-step-pill          amber "Step 3 of 10" / "1/10" pill
 *   (status pills: `tohfa-badge tohfa-badge-<tone>` via auditStatusPillClass)
 *
 * Forms
 *   .audit-form-grid          two-column field grid (one column ≤900px)
 *   .audit-field              label + control + helper stack; .audit-field.span-2 spans both columns
 *   .audit-label              field label; add .required for the red asterisk; .audit-label-lock = lock glyph
 *   .audit-control            input / select / textarea (theme radius, primary focus ring);
 *                             [readonly] / .is-readonly renders the beige read-only look
 *   .audit-select-wrap        wrapper adding a chevron to a native <select class="audit-control">
 *   .audit-input-icon-wrap    wrapper for an input with a trailing icon (child .audit-input-icon)
 *   textarea.audit-control    min-height for notes
 *   .audit-helper             muted helper line; .audit-counter = right-aligned "0/500"
 *   .audit-field-error        red helper line
 *   .audit-note-warn          small amber note under a field ("Report correction …")
 *   .audit-choice-row         wrap row of choice chips; .audit-choice = chip button,
 *                             .audit-choice.selected / [aria-pressed=true] = amber filled
 *
 * Upload
 *   .audit-dropzone           dashed upload drop zone (button or label); .audit-dropzone-icon,
 *                             .audit-dropzone-text, .audit-dropzone-hint
 *   .audit-file-chip          uploaded-file row (name + remove)
 *
 * Empty state
 *   .audit-empty              centred icon + bold line + muted hint (.audit-empty-icon,
 *                             .audit-empty-title, .audit-empty-hint)
 *
 * Footer
 *   .audit-footer             right-aligned button row; .audit-footer-status = left status text
 *   .audit-btn                44px min-height modifier for tohfa-btn buttons
 *   .audit-btn-outline        white bordered secondary button (Back / Save as Draft)
 *
 * Progress / stepper
 *   .audit-progress           track; child .audit-progress-fill with [style.width.%]
 *   .audit-ring               circular percentage; set [style.--audit-ring-pct]="pct" (0–100) and
 *                             put the label inside (.audit-ring-label)
 *   .audit-step-num           numbered circle; .is-current (amber) / .is-done (green)
 *
 * Tables & lists
 *   .audit-table-wrap         frame around <tohfa-data-table> + .audit-table-footer; tints the shared
 *                             table's header row amber (design 74/75) without editing the shared table
 *   .audit-table-footer       "Showing 1–10 of 10" + .audit-pager (Previous / n / Next)
 *   .audit-actions            inline "View - Reschedule" links; children .audit-action (link/button),
 *                             .audit-action.is-inert (not available), .audit-action-sep
 *   .audit-two-line           cell with bold first line + .audit-two-line-sub muted second line
 *
 * Filters
 *   .audit-filters            wrap row of search + filter pills
 *   .audit-search             label wrapping an icon + `tohfa-input`
 *   .audit-filter-pill        "Zone: All ⌄" select pill
 */
export const AUDIT_SHARED_STYLES = `
  :host {
    display: flex;
    flex-direction: column;
    gap: var(--space-18);
    font-family: var(--font);
    color: var(--tohfa-ink);
  }
  .icon {
    font-size: var(--icon-btn);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  /* ---------- Tones ---------- */
  .tone-fg-info { color: var(--info); }
  .tone-fg-warning { color: var(--warn); }
  .tone-fg-success { color: var(--ok); }
  .tone-fg-danger { color: var(--err); }
  .tone-fg-purple { color: var(--purple); }
  .tone-fg-neutral { color: var(--neutral-status); }
  .tone-fg-amber { color: var(--tohfa-amber); }
  .tone-fg-brown { color: var(--tohfa-brown); }
  .tone-bg-info { background: var(--info-bg); color: var(--info); }
  .tone-bg-warning { background: var(--warn-bg); color: var(--warn); }
  .tone-bg-success { background: var(--ok-bg); color: var(--ok); }
  .tone-bg-danger { background: var(--err-bg); color: var(--err); }
  .tone-bg-purple { background: var(--purple-bg); color: var(--purple); }
  .tone-bg-neutral { background: var(--neutral-status-bg); color: var(--neutral-status); }
  .tone-bg-amber { background: var(--tohfa-amber-tint); color: var(--tohfa-brown); }

  /* ---------- Page chrome ---------- */
  .audit-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-16);
  }
  .audit-title-row {
    display: flex;
    align-items: center;
    gap: var(--space-10);
  }
  .audit-title {
    margin: 0;
    font-size: var(--fs-title);
    font-weight: var(--fw-xbold);
    line-height: 1.2;
    color: var(--tohfa-ink);
  }
  .audit-title-icon {
    font-size: var(--icon-header-bell);
    color: var(--tohfa-ink);
  }
  .audit-title-tile {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-20) * 2);
    height: calc(var(--space-20) * 2);
    border-radius: var(--r-sm);
    background: var(--tohfa-amber-tint);
    color: var(--tohfa-brown);
  }
  .audit-title-tile .material-symbols-outlined {
    font-size: var(--icon-dialog-close);
  }
  .audit-subtitle {
    margin: var(--space-6) 0 0;
    font-size: var(--fs-dense);
    font-weight: var(--fw-semi);
    color: var(--tohfa-slate);
  }
  .audit-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-8);
    margin-top: var(--space-6);
    font-size: var(--fs-dense);
    font-weight: var(--fw-semi);
    color: var(--tohfa-slate);
  }
  .audit-header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-10);
  }
  .audit-icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-16) * 2);
    height: calc(var(--space-16) * 2);
    padding: 0;
    border: var(--border-card);
    border-radius: var(--r-circle);
    background: var(--tohfa-surface);
    color: var(--tohfa-ink);
    cursor: pointer;
  }
  .audit-icon-btn[aria-disabled='true'] {
    cursor: default;
  }
  .audit-icon-btn:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .audit-icon-btn .material-symbols-outlined {
    font-size: var(--icon-btn);
  }
  .audit-icon-btn-badge {
    position: absolute;
    top: calc(var(--space-6) * -1);
    right: calc(var(--space-6) * -1);
    min-width: var(--space-16);
    height: var(--space-16);
    padding: 0 var(--space-4);
    border-radius: var(--r-pill);
    background: var(--err);
    color: var(--tohfa-neutral-white);
    font-size: var(--fs-badge-s);
    font-weight: var(--fw-bold);
    line-height: var(--space-16);
    text-align: center;
  }
  .audit-section-title {
    margin: 0;
    font-size: var(--fs-card);
    font-weight: var(--fw-xbold);
    color: var(--tohfa-amber);
  }

  /* ---------- KPI row ---------- */
  .audit-kpis {
    display: grid;
    grid-template-columns: var(--layout-kpi-cols);
    gap: var(--space-12);
  }
  .audit-kpi {
    gap: var(--space-6);
    min-width: 0;
  }
  .audit-kpi-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-8);
  }
  .audit-kpi-value {
    font-size: var(--fs-kpi);
    font-weight: var(--fw-xbold);
    line-height: 1;
    color: var(--tohfa-ink);
  }
  .audit-kpi-label {
    font-size: var(--fs-label);
    font-weight: var(--fw-semi);
    color: var(--tohfa-ink);
  }
  .audit-kpi-icon {
    font-size: var(--icon-kpi-chip);
  }

  /* ---------- Cards ---------- */
  .audit-card {
    background: var(--tohfa-surface);
    border: var(--border-card);
    border-radius: var(--r-card);
    overflow: hidden;
    min-width: 0;
  }
  .audit-card-head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    margin: 0;
    padding: var(--space-12) var(--space-16);
    background: var(--tohfa-amber-tint);
    color: var(--tohfa-brown);
    font-size: var(--fs-cell);
    font-weight: var(--fw-xbold);
  }
  .audit-card-head .material-symbols-outlined {
    font-size: var(--icon-btn);
    color: var(--tohfa-brown);
  }
  .audit-card-body {
    padding: var(--space-16);
  }
  .audit-card-body.tight {
    padding: var(--space-10) var(--space-12);
  }
  .audit-card-title {
    margin: 0 0 var(--space-12);
    font-size: var(--fs-card);
    font-weight: var(--fw-xbold);
    color: var(--tohfa-amber);
  }
  .audit-grid-2,
  .audit-grid-3,
  .audit-grid-4 {
    display: grid;
    gap: var(--space-14);
    align-items: start;
  }
  .audit-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .audit-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .audit-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

  /* ---------- Label / value ---------- */
  .audit-kv {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
    margin: 0;
  }
  .audit-kv-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-12);
    font-size: var(--fs-dense);
  }
  .audit-kv-label {
    margin: 0;
    color: var(--tohfa-slate);
    font-weight: var(--fw-medium);
  }
  .audit-kv-value {
    margin: 0;
    color: var(--tohfa-ink);
    font-weight: var(--fw-bold);
    text-align: right;
  }
  .audit-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-16) var(--space-24);
  }
  .audit-summary-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-8);
    min-width: 0;
  }
  .audit-summary-icon {
    font-size: var(--icon-btn);
    color: var(--tohfa-amber);
  }
  .audit-summary-label {
    display: block;
    font-size: var(--fs-badge);
    color: var(--tohfa-slate);
  }
  .audit-summary-value {
    display: block;
    font-size: var(--fs-cell);
    font-weight: var(--fw-bold);
    color: var(--tohfa-ink);
  }

  /* ---------- Pills ---------- */
  .audit-step-pill {
    display: inline-flex;
    align-items: center;
    padding: var(--space-4) var(--space-8);
    border-radius: var(--r-badge-sm);
    background: var(--warn-bg);
    border: 1px solid var(--warn-bd);
    color: var(--tohfa-amber-active);
    font-size: var(--fs-badge-s);
    font-weight: var(--fw-bold);
    line-height: 1.2;
    white-space: nowrap;
  }

  /* ---------- Forms ---------- */
  .audit-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-16) var(--space-18);
  }
  .audit-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    min-width: 0;
  }
  .audit-field.span-2 {
    grid-column: 1 / -1;
  }
  .audit-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-4);
    margin: 0;
    font-size: var(--fs-dense);
    font-weight: var(--fw-bold);
    color: var(--tohfa-ink);
  }
  .audit-label.required::after {
    content: '*';
    color: var(--err);
  }
  .audit-label-lock {
    font-size: var(--icon-row-action);
    color: var(--tohfa-amber);
  }
  .audit-control {
    box-sizing: border-box;
    width: 100%;
    min-height: var(--tohfa-min-touch-target);
    padding: var(--space-10) var(--space-12);
    border: var(--border-input);
    border-radius: var(--tohfa-radius-input);
    background: var(--tohfa-surface);
    color: var(--tohfa-ink);
    font-family: var(--font);
    font-size: var(--fs-input);
    line-height: 1.4;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .audit-control::placeholder {
    color: var(--tohfa-muted);
  }
  .audit-control:focus,
  .audit-control:focus-visible {
    border-color: var(--tohfa-amber);
    box-shadow: var(--tohfa-focus-ring);
  }
  .audit-control:disabled {
    background: var(--tohfa-disabled-bg);
    color: var(--tohfa-disabled-fg);
    cursor: not-allowed;
  }
  .audit-control[readonly],
  .audit-control.is-readonly {
    background: var(--tohfa-neutral-chip-alt);
    border-color: var(--tohfa-neutral-chip-alt);
    font-weight: var(--fw-bold);
  }
  .audit-control[aria-invalid='true'] {
    border-color: var(--err);
  }
  textarea.audit-control {
    min-height: calc(var(--space-32) * 3);
    resize: vertical;
  }
  .audit-select-wrap,
  .audit-input-icon-wrap {
    position: relative;
  }
  .audit-select-wrap select.audit-control {
    appearance: none;
    padding-right: calc(var(--space-12) * 2 + var(--icon-chevron));
    cursor: pointer;
  }
  .audit-select-wrap::after {
    content: 'expand_more';
    position: absolute;
    top: 50%;
    right: var(--space-12);
    transform: translateY(-50%);
    font-family: 'Material Symbols Outlined';
    font-size: var(--icon-chevron);
    color: var(--tohfa-slate);
    pointer-events: none;
  }
  .audit-input-icon-wrap .audit-control {
    padding-right: calc(var(--space-12) * 2 + var(--icon-input));
  }
  .audit-input-icon {
    position: absolute;
    top: 50%;
    right: var(--space-12);
    transform: translateY(-50%);
    font-size: var(--icon-input);
    color: var(--tohfa-slate);
    pointer-events: none;
  }
  .audit-helper {
    margin: 0;
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
  }
  .audit-counter {
    margin: 0;
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
    text-align: right;
  }
  .audit-field-error {
    margin: 0;
    font-size: var(--fs-cap);
    font-weight: var(--fw-semi);
    color: var(--err);
  }
  .audit-note-warn {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    margin: 0;
    padding: var(--space-6) var(--space-10);
    border-radius: var(--r-xs);
    background: var(--tohfa-amber-tint);
    color: var(--tohfa-brown);
    font-size: var(--fs-badge);
  }
  .audit-note-warn .material-symbols-outlined {
    font-size: var(--icon-row-action);
  }
  .audit-choice-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
  }
  .audit-choice {
    min-width: calc(var(--space-14) * 2);
    min-height: calc(var(--space-14) * 2);
    padding: var(--space-4) var(--space-10);
    border: var(--border-card);
    border-radius: var(--r-sm);
    background: var(--tohfa-surface);
    color: var(--tohfa-ink);
    font-family: var(--font);
    font-size: var(--fs-cell);
    font-weight: var(--fw-semi);
    cursor: pointer;
  }
  .audit-choice:hover:not(.selected):not([aria-pressed='true']) {
    background: var(--tohfa-page);
  }
  .audit-choice.selected,
  .audit-choice[aria-pressed='true'],
  .audit-choice[aria-checked='true'] {
    background: var(--tohfa-amber);
    border-color: var(--tohfa-amber);
    color: var(--tohfa-neutral-white);
  }
  .audit-choice:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }

  /* ---------- Upload ---------- */
  .audit-dropzone {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    width: 100%;
    padding: var(--space-18) var(--space-16);
    border: var(--border-dropzone);
    border-radius: var(--tohfa-radius-input);
    background: var(--tohfa-page);
    color: var(--tohfa-brown);
    font-family: var(--font);
    text-align: center;
    cursor: pointer;
  }
  .audit-dropzone:hover {
    background: var(--tohfa-amber-tint);
  }
  .audit-dropzone:focus-within,
  .audit-dropzone:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .audit-dropzone-icon {
    font-size: var(--icon-nav);
    color: var(--tohfa-amber);
  }
  .audit-dropzone-text {
    font-size: var(--fs-cell);
    font-weight: var(--fw-bold);
    color: var(--tohfa-brown);
  }
  .audit-dropzone-hint {
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
  }
  .audit-file-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-8);
    padding: var(--space-8) var(--space-12);
    border: var(--border-card);
    border-radius: var(--r-sm);
    font-size: var(--fs-dense);
  }

  /* ---------- Empty state ---------- */
  .audit-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    padding: var(--space-24) var(--space-16);
    text-align: center;
  }
  .audit-empty-icon {
    font-size: var(--icon-dialog-hero);
    color: var(--tohfa-amber);
  }
  .audit-empty-title {
    margin: 0;
    font-size: var(--fs-cell);
    font-weight: var(--fw-bold);
    color: var(--tohfa-ink);
  }
  .audit-empty-hint {
    margin: 0;
    font-size: var(--fs-cap);
    color: var(--tohfa-slate);
  }

  /* ---------- Footer & buttons ---------- */
  .audit-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-10);
  }
  .audit-footer-status {
    margin: 0 auto 0 0;
    font-size: var(--fs-dense);
    font-weight: var(--fw-semi);
    color: var(--ok);
  }
  .audit-btn {
    min-height: var(--tohfa-min-touch-target);
    padding-left: var(--space-24);
    padding-right: var(--space-24);
    border-radius: var(--tohfa-radius-button);
  }
  .audit-btn-outline {
    background: var(--tohfa-surface);
    color: var(--tohfa-ink);
    border: var(--border-card);
    border-radius: var(--tohfa-radius-button);
    padding: var(--space-10) var(--space-16);
    font-size: var(--fs-cell);
  }
  .audit-btn-outline:hover:not(:disabled) {
    background: var(--tohfa-page);
  }

  /* ---------- Progress / stepper ---------- */
  .audit-progress {
    height: var(--space-6);
    border-radius: var(--r-pill);
    background: var(--tohfa-divider);
    overflow: hidden;
  }
  .audit-progress-fill {
    height: 100%;
    border-radius: var(--r-pill);
    background: var(--tohfa-amber);
  }
  .audit-ring {
    --audit-ring-pct: 0;
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-24) * 2);
    height: calc(var(--space-24) * 2);
    border-radius: var(--r-circle);
    background: conic-gradient(
      var(--tohfa-amber) calc(var(--audit-ring-pct) * 1%),
      var(--tohfa-amber-tint) 0
    );
  }
  .audit-ring::before {
    content: '';
    position: absolute;
    inset: var(--space-4);
    border-radius: var(--r-circle);
    background: var(--tohfa-surface);
  }
  .audit-ring-label {
    position: relative;
    font-size: var(--fs-badge);
    font-weight: var(--fw-xbold);
    color: var(--tohfa-ink);
  }
  .audit-step-num {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-12) * 2);
    height: calc(var(--space-12) * 2);
    border-radius: var(--r-circle);
    background: var(--tohfa-amber-tint);
    color: var(--tohfa-brown);
    font-size: var(--fs-badge);
    font-weight: var(--fw-xbold);
  }
  .audit-step-num.is-current {
    background: var(--tohfa-amber);
    color: var(--tohfa-neutral-white);
  }
  .audit-step-num.is-done {
    background: var(--ok-bg);
    color: var(--ok);
  }

  /* ---------- Tables ---------- */
  .audit-table-wrap {
    background: var(--tohfa-surface);
    border: var(--border-card);
    border-radius: var(--r-card);
    overflow: hidden;
  }
  /* The shared data table draws its own frame; inside the wrap it should not. */
  .audit-table-wrap ::ng-deep .table-card {
    border: none;
    border-radius: 0;
  }
  /* Designs 74/75: the header row is amber-tinted, title-case, ink. */
  .audit-table-wrap ::ng-deep th {
    background: var(--tohfa-amber-tint);
    color: var(--tohfa-ink);
    text-transform: none;
    letter-spacing: 0;
    font-size: var(--fs-badge);
  }
  .audit-table-wrap ::ng-deep td {
    font-size: var(--fs-dense);
    vertical-align: middle;
  }
  .audit-table-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-12);
    padding: var(--space-14) var(--space-16);
    border-top: var(--border-divider);
    background: var(--tohfa-surface);
  }
  .audit-table-range {
    font-size: var(--fs-dense);
    color: var(--tohfa-slate);
  }
  .audit-pager {
    display: flex;
    align-items: center;
    gap: var(--space-6);
  }
  .audit-pager button {
    box-sizing: border-box;
    min-width: calc(var(--space-15) * 2);
    height: calc(var(--space-15) * 2);
    padding: 0 var(--space-12);
    line-height: 1;
    border: var(--border-card);
    border-radius: var(--tohfa-radius-button);
    background: var(--tohfa-surface);
    color: var(--tohfa-slate);
    font-family: var(--font);
    font-size: var(--fs-dense);
    font-weight: var(--fw-medium);
    cursor: pointer;
  }
  .audit-pager button:hover:not([disabled]):not(.active) {
    background: var(--tohfa-page);
    color: var(--tohfa-ink);
  }
  .audit-pager button.active {
    background: var(--tohfa-amber);
    border-color: var(--tohfa-amber);
    color: var(--tohfa-neutral-white);
    font-weight: var(--fw-bold);
  }
  .audit-pager button[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .audit-pager button:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .audit-actions {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
    white-space: normal;
  }
  .audit-action {
    padding: 0;
    border: none;
    border-radius: var(--r-xs);
    background: none;
    color: var(--tohfa-ink);
    font-family: var(--font);
    font-size: var(--fs-dense);
    font-weight: var(--fw-bold);
    text-decoration: none;
    cursor: pointer;
  }
  .audit-action:hover {
    color: var(--tohfa-amber);
  }
  .audit-action.accent {
    color: var(--tohfa-amber-active);
  }
  .audit-action.is-inert {
    cursor: default;
  }
  .audit-action:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .audit-action-sep {
    color: var(--tohfa-ink);
    font-weight: var(--fw-bold);
  }
  .audit-two-line {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    white-space: normal;
  }
  .audit-two-line-main {
    font-weight: var(--fw-bold);
  }
  .audit-two-line-sub {
    font-size: var(--fs-cap);
    color: var(--tohfa-slate);
  }

  /* ---------- Filters ---------- */
  .audit-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-10);
  }
  .audit-search {
    position: relative;
    flex: 1 1 calc(var(--space-32) * 8);
  }
  .audit-search .material-symbols-outlined {
    position: absolute;
    left: var(--space-14);
    top: 50%;
    transform: translateY(-50%);
    color: var(--tohfa-muted);
    font-size: var(--icon-input);
    pointer-events: none;
  }
  .audit-search .tohfa-input {
    box-sizing: border-box;
    padding-left: calc(var(--space-14) + var(--icon-input) + var(--space-6));
    border-radius: var(--r-md);
  }
  .audit-filter-pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-10) var(--space-12) var(--space-10) var(--space-14);
    background: var(--tohfa-surface);
    border: var(--border-input);
    border-radius: var(--r-md);
    font-family: var(--font);
    font-size: var(--fs-cell);
    font-weight: var(--fw-semi);
    color: var(--tohfa-ink);
    cursor: pointer;
  }
  .audit-filter-pill:focus-within {
    border-color: var(--tohfa-amber);
    box-shadow: var(--tohfa-focus-ring);
  }
  .audit-filter-pill select {
    appearance: none;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    padding: 0;
    outline: none;
    cursor: inherit;
  }
  .audit-filter-pill .material-symbols-outlined {
    font-size: var(--icon-chevron);
    color: var(--tohfa-slate);
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 1200px) {
    .audit-kpis {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .audit-grid-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 900px) {
    .audit-form-grid,
    .audit-grid-2,
    .audit-grid-3 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 640px) {
    .audit-kpis,
    .audit-grid-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .audit-page-header {
      flex-direction: column;
    }
  }
`;
