/**
 * Styles shared by the Add Farm Records forms (Diary, Plant, Assets). Each form is its own standalone
 * component with encapsulated styles, so the common card / field / "+ Add" / footer look lives here once
 * and every form lists it in `styles`. Theme variables only (theme.css + tokens.generated.css).
 */
export const FARM_RECORDS_FORM_STYLES = `
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

  /* ---------- Card ---------- */
  .card {
    padding: 0;
    overflow: hidden;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    margin: 0;
    padding: var(--space-18) var(--space-18) 0;
    color: var(--tohfa-brown);
    font-size: var(--fs-card);
    font-weight: var(--fw-xbold);
  }
  .card-head .icon {
    font-size: var(--icon-nav);
    color: var(--tohfa-amber);
  }
  .card-head.tinted {
    padding: var(--space-14) var(--space-18);
    background: var(--tohfa-amber-tint);
  }
  .card-head.tinted .icon {
    color: var(--tohfa-brown);
  }
  .card-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-18) var(--space-18);
    padding: var(--space-18);
  }
  .card-body.single {
    grid-template-columns: minmax(0, 1fr);
    padding-bottom: var(--space-32);
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--space-18);
    min-width: 0;
  }

  /* ---------- Fields ---------- */
  .field {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .field-label {
    display: block;
    margin: 0 0 var(--space-8);
    font-size: var(--fs-cell);
    font-weight: var(--fw-xbold);
  }
  .req {
    color: var(--err);
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-10);
  }
  .control {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    min-width: 0;
  }
  .tohfa-input {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-input);
    font-size: var(--fs-input);
  }
  .tohfa-input.invalid {
    border-color: var(--err);
  }
  select.tohfa-input {
    appearance: none;
    padding-right: var(--space-32);
    cursor: pointer;
  }
  select.tohfa-input.placeholder {
    color: var(--tohfa-muted);
  }
  select.tohfa-input option {
    color: var(--tohfa-ink);
  }
  select.tohfa-input:disabled {
    cursor: not-allowed;
  }
  .trail {
    position: absolute;
    right: var(--space-14);
    font-size: var(--icon-input);
    color: var(--tohfa-slate);
    pointer-events: none;
  }
  textarea.tohfa-input {
    min-height: calc(var(--space-20) * 5);
    resize: vertical;
  }
  .counter {
    align-self: flex-end;
    margin-top: var(--space-6);
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
  }
  .field-error {
    margin: var(--space-4) 0 0;
    font-size: var(--fs-cap);
    color: var(--err);
  }

  /* "+ Add" beside a select: inert until the add-option dialogs are designed. */
  .add-btn {
    flex: none;
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-button);
    padding: 0 var(--space-16);
    color: var(--tohfa-amber);
    cursor: default;
  }
  .add-btn .icon {
    font-size: var(--icon-row-action);
  }

  /* ---------- Footer ---------- */
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-12);
  }
  .foot.split {
    justify-content: space-between;
  }
  .foot .tohfa-btn {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-button);
  }
  .form-error {
    margin: 0;
    font-size: var(--fs-cell);
    color: var(--err);
  }
  .status {
    margin: 0;
    font-size: var(--fs-cell);
    font-weight: var(--fw-bold);
    color: var(--ok);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .card-body {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;
