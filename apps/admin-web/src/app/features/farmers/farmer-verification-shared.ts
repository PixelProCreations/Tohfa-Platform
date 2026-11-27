/**
 * Pieces shared by the Verification & Compliance tab and its three dialogs: the status → pill
 * mapping and the destructive-dialog chrome (tinted header, scrolling body, footer). Kept in one
 * place so the three dialogs cannot drift apart visually.
 */
import type { CertificationStatusMock, ProduceToneMock } from './farmer-verification.mock';

export interface StatusMeta {
  icon: string;
  /** Theme badge modifier from theme.css. */
  badge: 'tohfa-badge-success' | 'tohfa-badge-danger';
  /** Tone of the certification icon tile. */
  tone: 'ok' | 'err';
}

export const CERT_STATUS_META: Record<CertificationStatusMock, StatusMeta> = {
  VERIFIED: { icon: 'check_circle', badge: 'tohfa-badge-success', tone: 'ok' },
  EXPIRED: { icon: 'schedule', badge: 'tohfa-badge-danger', tone: 'err' },
  UNVERIFIED: { icon: 'block', badge: 'tohfa-badge-danger', tone: 'err' },
};

export const PRODUCE_TONE_CLASS: Record<ProduceToneMock, string> = {
  amber: 'tone-amber',
  brown: 'tone-brown',
  red: 'tone-red',
  green: 'tone-green',
};

/** Styles common to the three verification dialogs. Every value is a theme variable. */
export const VERIFICATION_DIALOG_STYLES = `
  :host {
    font-family: var(--font);
    color: var(--tohfa-ink);
  }
  .icon {
    font-size: var(--icon-btn);
  }
  .vd {
    display: flex;
    flex-direction: column;
    max-width: calc(var(--space-32) * 25);
    width: calc(100vw - var(--space-32) * 2);
    max-height: calc(100vh - var(--space-32) * 2);
    padding: 0;
    overflow: hidden;
  }

  /* ---------- Header ---------- */
  .vd-head {
    display: flex;
    align-items: center;
    gap: var(--space-16);
    padding: var(--space-24) var(--space-28);
    background: var(--tohfa-amber-tint);
    border-bottom: var(--border-divider);
  }
  .vd-head-tile {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-24) * 2);
    height: calc(var(--space-24) * 2);
    border-radius: var(--r-md);
    background: var(--err-bg);
    color: var(--err);
  }
  .vd-head-tile .icon {
    font-size: calc(var(--icon-dialog-close) + var(--space-4));
  }
  .vd-head-text {
    flex: 1;
    min-width: 0;
  }
  .vd-title {
    margin: 0;
    font-size: var(--fs-title-dialog);
    font-weight: var(--fw-xbold);
    line-height: 1.2;
    color: var(--err);
  }
  .vd-sub {
    margin: var(--space-6) 0 0;
    font-size: var(--fs-cell);
    color: var(--tohfa-slate);
  }
  .vd-close {
    display: inline-flex;
    flex: none;
    padding: var(--space-4);
    border: none;
    border-radius: var(--r-xs);
    background: none;
    color: var(--tohfa-ink);
    cursor: pointer;
  }
  .vd-close .icon {
    font-size: var(--icon-dialog-close);
  }
  .vd-close:focus-visible {
    outline: none;
    box-shadow: var(--tohfa-focus-ring);
  }

  /* ---------- Body / footer ---------- */
  .vd-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-24) var(--space-28);
  }
  .vd-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-12);
    padding: var(--space-18) var(--space-28);
    border-top: var(--border-divider);
  }
  .vd-foot .tohfa-btn {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-button);
  }

  /* ---------- Certificate summary ---------- */
  .cert-tile {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--space-20) * 2);
    height: calc(var(--space-20) * 2);
    border-radius: var(--r-sm);
  }
  .cert-tile .icon {
    font-size: var(--icon-nav);
  }
  .cert-tile.ok {
    background: var(--ok-bg);
    color: var(--ok);
  }
  .cert-tile.err {
    background: var(--err-bg);
    color: var(--err);
  }
  .cert-tile.on-tint {
    background: var(--tohfa-surface);
  }
  .pill {
    gap: var(--space-4);
  }
  .pill .icon {
    font-size: var(--fs-cell);
  }
  .pill.on-tint {
    background: var(--tohfa-surface);
  }
  .kv-list {
    margin: 0;
  }
  .kv {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-12);
    padding: var(--space-10) 0;
    border-bottom: var(--border-divider);
    font-size: var(--fs-cell);
  }
  .kv:last-child {
    border-bottom: none;
  }
  .kv dt {
    color: var(--tohfa-slate);
  }
  .kv dd {
    margin: 0;
    font-weight: var(--fw-bold);
    text-align: right;
    overflow-wrap: anywhere;
  }

  /* ---------- Fields ---------- */
  .field {
    margin-bottom: var(--space-16);
  }
  .field:last-child {
    margin-bottom: 0;
  }
  .field-label {
    display: block;
    margin: 0 0 var(--space-8);
    padding: 0;
    font-size: var(--fs-cell);
    font-weight: var(--fw-bold);
  }
  .req {
    color: var(--err);
  }
  .tohfa-input {
    min-height: var(--tohfa-min-touch-target);
    border-radius: var(--tohfa-radius-input);
  }
  textarea.tohfa-input {
    min-height: calc(var(--space-32) * 3);
    resize: vertical;
  }
  .select-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .select-wrap select {
    appearance: none;
    padding-right: var(--space-32);
    cursor: pointer;
  }
  .select-wrap .chev {
    position: absolute;
    right: var(--space-12);
    font-size: var(--icon-input);
    color: var(--tohfa-slate);
    pointer-events: none;
  }
  .counter {
    display: block;
    margin-top: var(--space-4);
    font-size: var(--fs-cap);
    color: var(--tohfa-muted);
    text-align: right;
  }

  /* ---------- Danger banner (bold title line + regular body line) ---------- */
  .warn {
    display: flex;
    align-items: flex-start;
    gap: var(--space-10);
    padding: var(--space-14) var(--space-18);
    border-radius: var(--r-md);
    background: var(--err-bg);
    font-size: var(--fs-dense);
    line-height: 1.5;
  }
  .warn > .icon {
    flex: none;
    margin-top: var(--space-4);
    font-size: var(--icon-btn);
    color: var(--err);
  }
  .warn strong {
    display: block;
    color: var(--err);
    font-weight: var(--fw-xbold);
  }
  .warn strong.inline {
    display: inline;
  }

  @media (max-width: 760px) {
    .vd-head,
    .vd-body,
    .vd-foot {
      padding-left: var(--space-16);
      padding-right: var(--space-16);
    }
  }
`;
