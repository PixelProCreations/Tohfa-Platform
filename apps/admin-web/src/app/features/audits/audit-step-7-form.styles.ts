/**
 * Extra form styles shared by inspection steps 7–12 (designs 85–90), listed after the module styles:
 *
 *   styles: [AUDIT_SHARED_STYLES, AUDIT_STEP_FORM_STYLES, `...screen rules...`]
 *
 * It lives under the step-7 file name only because the steps 7–12 screens were built together and may
 * not edit audit-shared.styles.ts. Theme variables only.
 *
 *   .step-error-summary     red-tinted box listing what blocks Save / Submit (role="alert");
 *                           children .step-error-title, .step-error-list, .step-error-link (button)
 *   .step-card-head-icon    icon size inside .audit-card-head (Material Symbols)
 *   .step-icon-left         input wrapper with a leading glyph (child .step-icon-left-glyph)
 *   .step-count-row         helper + counter on one line under a textarea
 */
export const AUDIT_STEP_FORM_STYLES = `
  .step-error-summary {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-12) var(--space-16);
    border: 1px solid var(--err-bd);
    border-radius: var(--r-md);
    background: var(--err-bg);
    color: var(--err);
  }
  .step-error-title {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    margin: 0;
    font-size: var(--fs-dense);
    font-weight: var(--fw-bold);
  }
  .step-error-title .material-symbols-outlined {
    font-size: var(--icon-btn);
  }
  .step-error-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin: 0;
    padding-left: var(--space-24);
    font-size: var(--fs-dense);
  }
  .step-error-link {
    padding: 0;
    border: none;
    background: none;
    color: var(--err);
    font-family: var(--font);
    font-size: var(--fs-dense);
    font-weight: var(--fw-semi);
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }
  .step-error-link:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }
  .step-icon-left {
    position: relative;
  }
  .step-icon-left .audit-control {
    padding-left: calc(var(--space-12) + var(--icon-input) + var(--space-8));
  }
  .step-icon-left-glyph {
    position: absolute;
    top: 50%;
    left: var(--space-12);
    transform: translateY(-50%);
    font-size: var(--icon-input);
    color: var(--tohfa-slate);
    pointer-events: none;
  }
  .step-count-row {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-8);
  }
  select.audit-control.is-placeholder {
    color: var(--tohfa-muted);
  }
  select.audit-control option {
    color: var(--tohfa-ink);
  }
`;
