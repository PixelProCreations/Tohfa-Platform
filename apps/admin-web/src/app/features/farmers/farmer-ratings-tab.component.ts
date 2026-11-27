/**
 * Farmers Management → Farmer Details → Ratings tab.
 *
 * UI ONLY. The API has no farmer-rating endpoints yet, so the tab renders the placeholder dataset in
 * `farmer-ratings.mock.ts` and every action (Edit Rating, Save Rating, Confirm) changes local state
 * only — nothing is persisted and nothing is sent to the backend. When the tab is integrated, the
 * contract goes into docs/openapi.yaml, the route gets its own `requirePermission` code in
 * docs/rbac.json, and this component swaps the mock for a service call.
 *
 * Three states, switched in place under the page's tab pills:
 * - view: overall rating, the ten category scores, and the rating history;
 * - edit: an accordion of the ten categories (one open at a time) with a live overall total
 *   (the sum of the ten 1–10 scores, out of 100) and the update details form;
 * - the "Save Rating?" confirmation dialog, opened from the edit view.
 *
 * "Previous" in the edit view and the dialog is the stored `previousOverall` (68 in the mock) and the
 * change is the live draft total minus it, matching the design (Previous 68, Current 78, +10). On
 * Confirm the overall being replaced becomes the new stored `previousOverall`.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, computed, inject, signal } from '@angular/core';
import { DialogFocusDirective } from './dialog-focus.directive';
import {
  FARMER_RATINGS_MOCK,
  RATING_CATEGORY_MAX,
  RATING_REMARKS_MAX,
  RATING_TIER_FAIR,
  RATING_TIER_GOOD,
  type FarmerRatingCategory,
  type FarmerRatingHistoryEntry,
} from './farmer-ratings.mock';
import { FARMER_RATINGS_STRINGS as S } from './farmer-ratings-tab.strings';

type Mode = 'view' | 'edit';
type Tier = 'ok' | 'warn' | 'err';
type ChangeTone = 'up' | 'down' | 'none';

/** Category scores 1..10, the buttons of the edit view's rating grid. */
const SCORE_OPTIONS: readonly number[] = Array.from({ length: RATING_CATEGORY_MAX }, (_, i) => i + 1);

let nextRatingsId = 0;

function sum(scores: readonly number[]): number {
  return scores.reduce((total, s) => total + s, 0);
}

function tierOf(overall: number): Tier {
  if (overall >= RATING_TIER_GOOD) return 'ok';
  if (overall >= RATING_TIER_FAIR) return 'warn';
  return 'err';
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

@Component({
  selector: 'tohfa-farmer-ratings-tab',
  standalone: true,
  imports: [CommonModule, DialogFocusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font);
        color: var(--tohfa-ink);
      }
      .icon {
        font-size: var(--icon-btn);
      }
      .page {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
      }

      /* ---------- Page head ---------- */
      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-16);
      }
      .head-text {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        column-gap: var(--space-12);
        align-items: center;
      }
      .head-icon {
        grid-row: 1 / span 2;
        font-size: var(--icon-dialog-close);
        color: var(--tohfa-amber);
      }
      .title {
        margin: 0;
        font-size: var(--fs-page);
        font-weight: var(--fw-bold);
      }
      .title:focus {
        outline: none;
      }
      .subtitle {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .btn-edit {
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-10) var(--space-24);
        font-size: var(--fs-cell);
      }

      /* ---------- Shared card bits ---------- */
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0;
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-brown);
      }
      .card-title .icon.amber {
        color: var(--tohfa-amber);
      }

      /* Overall rating card (green / amber / red by tier). */
      .overall {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;
        gap: var(--space-4);
        padding: var(--space-24);
        border-radius: var(--r-card);
        text-align: center;
      }
      .overall.tier-ok {
        background: var(--ok-bg);
        border: 1px solid var(--ok-bd);
      }
      .overall.tier-warn {
        background: var(--warn-bg);
        border: 1px solid var(--warn-bd);
      }
      .overall.tier-err {
        background: var(--err-bg);
        border: 1px solid var(--err-bd);
      }
      .overall-label {
        margin: 0;
        font-size: var(--fs-label);
        font-weight: var(--fw-xbold);
        letter-spacing: 0.3px;
        text-transform: uppercase;
      }
      .tier-ok .overall-label,
      .tier-ok .change {
        color: var(--ok);
      }
      .tier-warn .overall-label,
      .tier-warn .change {
        color: var(--warn);
      }
      .tier-err .overall-label,
      .tier-err .change {
        color: var(--err);
      }
      .overall-value {
        margin: var(--space-4) 0 0;
        line-height: 1;
      }
      .overall-num {
        font-size: calc(var(--fs-hero) * 1.45);
        font-weight: var(--fw-xbold);
      }
      .overall-of {
        margin-left: var(--space-4);
        font-size: var(--fs-title);
        font-weight: var(--fw-bold);
        color: var(--tohfa-slate);
      }
      .overall-prev {
        margin: var(--space-6) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }
      .overall-prev .sep {
        margin: 0 var(--space-6);
        color: var(--tohfa-ink);
      }
      .change {
        font-weight: var(--fw-bold);
      }
      .progress {
        display: flex;
        align-items: center;
        gap: var(--space-14);
        margin-top: var(--space-18);
      }
      .track {
        flex: 1 1 auto;
        height: var(--space-8);
        border-radius: var(--r-pill);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: var(--r-pill);
      }
      .tier-ok .track {
        background: var(--ok-bd);
      }
      .tier-ok .fill {
        background: var(--ok);
      }
      .tier-warn .track {
        background: var(--warn-bd);
      }
      .tier-warn .fill {
        background: var(--warn);
      }
      .tier-err .track {
        background: var(--err-bd);
      }
      .tier-err .fill {
        background: var(--err);
      }
      .pct {
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }
      .tier-ok .pct {
        color: var(--ok);
      }
      .tier-warn .pct {
        color: var(--warn);
      }
      .tier-err .pct {
        color: var(--err);
      }

      /* ---------- View ---------- */
      .view-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr);
        gap: var(--space-16);
        align-items: stretch;
      }
      .table {
        width: 100%;
        margin-top: var(--space-16);
        border-collapse: collapse;
        font-size: var(--fs-cell);
      }
      .table th {
        padding: var(--space-10) var(--space-12);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-table-header);
        font-weight: var(--fw-xbold);
        letter-spacing: 0.3px;
        text-align: left;
        text-transform: uppercase;
      }
      .table th:first-child {
        border-radius: var(--r-sm) 0 0 var(--r-sm);
      }
      .table th:last-child {
        border-radius: 0 var(--r-sm) var(--r-sm) 0;
      }
      .table td {
        padding: var(--space-10) var(--space-12);
        border-bottom: var(--border-divider);
      }
      .table tr:last-child td {
        border-bottom: none;
      }
      .col-index {
        width: 13%;
      }
      .col-score {
        width: 20%;
      }
      .cell-index {
        color: var(--tohfa-muted);
      }
      .cell-score {
        font-weight: var(--fw-xbold);
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
        margin: var(--space-14) 0 0;
        padding: 0;
        list-style: none;
      }
      .history-item {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-16);
        padding: var(--space-12) var(--space-16);
        border: var(--border-card);
        border-radius: var(--r-md);
        font-size: var(--fs-dense);
      }
      .score-pill {
        padding: var(--space-8) var(--space-14);
        border-radius: var(--r-sm);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
        white-space: nowrap;
      }
      .score-pill.tier-ok {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .score-pill.tier-warn {
        background: var(--warn-bg);
        color: var(--warn);
      }
      .score-pill.tier-err {
        background: var(--err-bg);
        color: var(--err);
      }
      .history-date {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        color: var(--tohfa-slate);
      }
      .history-date .icon {
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
      }
      .history-meta {
        color: var(--tohfa-slate);
      }
      .history-meta strong {
        color: var(--tohfa-ink);
        font-weight: var(--fw-bold);
      }
      .empty {
        margin: var(--space-14) 0 0;
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }

      /* ---------- Edit ---------- */
      .head-badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
      }
      .head-badge {
        padding: var(--space-10) var(--space-16);
        border-radius: var(--r-md);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        white-space: nowrap;
      }
      .head-badge strong {
        font-weight: var(--fw-xbold);
      }
      .head-badge.prev {
        background: var(--tohfa-neutral-chip-alt);
        color: var(--tohfa-slate);
      }
      .head-badge.prev strong {
        color: var(--tohfa-ink);
      }
      .head-badge.now {
        background: var(--ok-bg);
        border: 1px solid var(--ok-bd);
        color: var(--ok);
      }
      .edit-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
        gap: var(--space-16);
        align-items: start;
      }
      .accordion {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
      }
      .acc-item {
        border: var(--border-card);
        border-radius: var(--r-nav-item);
        background: var(--tohfa-surface);
        overflow: hidden;
      }
      .acc-item.open {
        border-color: var(--tohfa-amber-border);
      }
      .acc-head {
        margin: 0;
      }
      .acc-toggle {
        display: flex;
        align-items: center;
        gap: var(--space-12);
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        padding: var(--space-12) var(--space-16);
        border: none;
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-body);
        font-weight: var(--fw-bold);
        text-align: left;
        cursor: pointer;
      }
      .open .acc-toggle {
        background: var(--tohfa-amber-tint);
      }
      .acc-toggle:focus-visible {
        outline: none;
        box-shadow: inset var(--tohfa-focus-ring);
      }
      .acc-toggle .icon {
        font-size: var(--icon-chevron);
        color: var(--tohfa-brown);
      }
      .acc-name {
        flex: 1 1 auto;
      }
      .acc-score {
        font-weight: var(--fw-xbold);
      }
      .acc-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--space-16);
        padding: var(--space-16);
      }
      .field-label {
        display: block;
        margin: 0 0 var(--space-8);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        color: var(--tohfa-ink);
      }
      .req::after {
        content: ' *';
        color: var(--err);
      }
      .score-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: var(--space-8);
      }
      .score-btn {
        min-height: calc(var(--space-18) * 2);
        border: var(--border-input);
        border-radius: var(--r-sm);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .score-btn:hover {
        background: var(--tohfa-page);
      }
      .score-btn.selected {
        border-color: var(--tohfa-amber);
        background: var(--tohfa-amber);
        color: var(--tohfa-surface);
      }
      .score-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      textarea.tohfa-input {
        display: block;
        resize: vertical;
      }
      .counter {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-badge);
        color: var(--tohfa-muted);
        text-align: right;
      }

      .side {
        display: flex;
        flex-direction: column;
        gap: var(--space-16);
      }
      .details-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--space-14) var(--space-12);
        margin-top: var(--space-16);
      }
      .details-grid .full {
        grid-column: 1 / -1;
      }
      .input-icon {
        position: relative;
      }
      .input-icon .icon {
        position: absolute;
        top: 50%;
        left: var(--space-12);
        transform: translateY(-50%);
        font-size: var(--icon-row-action);
        color: var(--tohfa-slate);
        pointer-events: none;
      }
      .input-icon .tohfa-input {
        padding-left: calc(var(--space-12) + var(--space-18));
      }
      .details-grid .tohfa-input {
        border-radius: var(--r-md);
      }
      .field-error {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--err);
      }
      .edit-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--space-12);
      }
      .edit-actions .tohfa-btn,
      .dialog-actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }

      /* ---------- Save Rating dialog ---------- */
      .dialog {
        position: relative;
        max-width: calc(var(--space-32) * 20);
        max-height: calc(100vh - var(--space-32) * 2);
        overflow-y: auto;
        text-align: center;
      }
      .dialog-close {
        position: absolute;
        top: var(--space-24);
        right: var(--space-24);
        display: inline-flex;
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .dialog-close .icon {
        font-size: var(--icon-dialog-close);
      }
      .dialog-close:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .hero {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-32) * 2);
        height: calc(var(--space-32) * 2);
        border-radius: var(--r-circle);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
      }
      .hero .icon {
        font-size: var(--icon-dialog-hero);
      }
      .dialog-title {
        margin: var(--space-14) 0 var(--space-8);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
      }
      .dialog-sub {
        margin: 0 0 var(--space-18);
        font-size: var(--fs-cell);
        color: var(--tohfa-slate);
      }
      .compare {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-12);
        padding: var(--space-16) var(--space-18);
        border-radius: var(--r-md);
        background: var(--tohfa-page);
      }
      .compare-label {
        display: block;
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
      }
      .compare-value {
        display: block;
        margin-top: var(--space-6);
        font-size: var(--fs-title-login);
        font-weight: var(--fw-xbold);
      }
      .compare-value.up {
        color: var(--ok);
      }
      .compare-value.down {
        color: var(--err);
      }
      .compare-arrow {
        color: var(--tohfa-slate);
      }
      .chip {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-8) var(--space-12);
        border-radius: var(--r-sm);
        font-size: var(--fs-cell);
        font-weight: var(--fw-xbold);
      }
      .chip-line {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
      }
      .chip small {
        font-size: var(--fs-badge-s);
        font-weight: var(--fw-bold);
      }
      .chip.up {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .chip.down {
        background: var(--err-bg);
        color: var(--err);
      }
      .chip.none {
        background: var(--neutral-status-bg);
        color: var(--neutral-status);
      }
      .summary {
        display: flex;
        flex-direction: column;
        gap: var(--space-12);
        margin: var(--space-16) 0 0;
        padding: var(--space-18);
        border: var(--border-card);
        border-radius: var(--r-md);
        text-align: left;
      }
      .summary div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
      }
      .summary dt {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
        font-size: var(--fs-cell);
        font-weight: var(--fw-semi);
        color: var(--tohfa-slate);
      }
      .summary dt .icon,
      .remarks-label .icon {
        font-size: var(--icon-row-action);
        color: var(--tohfa-brown);
      }
      .summary dd {
        margin: 0;
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        text-align: right;
        overflow-wrap: anywhere;
      }
      .remarks-label {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: var(--space-16) 0 var(--space-8);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        text-align: left;
      }
      .remarks-box {
        min-height: calc(var(--space-24) * 3);
        margin: 0;
        padding: var(--space-12) var(--space-14);
        border: var(--border-card);
        border-radius: var(--r-md);
        font-size: var(--fs-cell);
        text-align: left;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
      }
      .note {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: var(--space-14) 0 var(--space-18);
        padding: var(--space-10) var(--space-14);
        border-radius: var(--r-sm);
        background: var(--ok-bg);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
        text-align: left;
      }
      .note .icon {
        color: var(--ok);
      }
      .dialog-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.45fr);
        gap: var(--space-12);
      }

      @media (max-width: 1100px) {
        .view-grid,
        .edit-grid {
          grid-template-columns: minmax(0, 1fr);
        }
        .head {
          flex-wrap: wrap;
        }
      }
      @media (max-width: 640px) {
        .acc-body,
        .details-grid {
          grid-template-columns: minmax(0, 1fr);
        }
        .compare {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `,
  ],
  template: `
    <!-- ======================= View ======================= -->
    <div class="page" *ngIf="mode() === 'view'">
      <div class="head">
        <div class="head-text">
          <span class="material-symbols-outlined head-icon" aria-hidden="true">star</span>
          <h2 class="title" tabindex="-1" data-view-title>{{ S.VIEW_TITLE }}</h2>
          <p class="subtitle">{{ S.VIEW_SUBTITLE }}</p>
        </div>
        <button type="button" class="tohfa-btn tohfa-btn-primary btn-edit" data-edit-rating (click)="startEdit()">
          <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.BTN_EDIT_RATING }}
        </button>
      </div>

      <div class="view-grid">
        <section class="overall tier-{{ tier(overall()) }}" [attr.aria-labelledby]="ids.overall">
          <p class="overall-label" [id]="ids.overall">{{ S.NEW_OVERALL_RATING }}</p>
          <p class="overall-value">
            <span class="overall-num">{{ overall() }}</span><span class="overall-of">{{ S.OUT_OF_100 }}</span>
          </p>
          <p class="overall-prev">{{ S.previousLine(previousOverall()) }}</p>
          <div class="progress">
            <div
              class="track"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="overall()"
              [attr.aria-label]="S.OVERALL_PROGRESS_LABEL"
            >
              <div class="fill" [style.width.%]="overall()"></div>
            </div>
            <span class="pct" aria-hidden="true">{{ S.percent(overall()) }}</span>
          </div>
        </section>

        <section class="tohfa-card" [attr.aria-labelledby]="ids.categories">
          <h3 class="card-title" [id]="ids.categories">
            <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.CATEGORIES_TITLE }}
          </h3>
          <table class="table">
            <thead>
              <tr>
                <th scope="col" class="col-index">{{ S.COL_INDEX }}</th>
                <th scope="col">{{ S.COL_CATEGORY }}</th>
                <th scope="col" class="col-score">{{ S.COL_SCORE }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of categories(); let i = index; trackBy: trackCategory">
                <td class="cell-index">{{ index2(i) }}</td>
                <td>{{ c.name }}</td>
                <td class="cell-score">{{ S.outOf10(c.score) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <section class="tohfa-card" [attr.aria-labelledby]="ids.history">
        <h3 class="card-title" [id]="ids.history">
          <span class="material-symbols-outlined icon" aria-hidden="true">history</span>{{ S.HISTORY_TITLE }}
        </h3>
        <ul class="history-list" *ngIf="history().length > 0; else noHistory">
          <li class="history-item" *ngFor="let h of history(); trackBy: trackHistory">
            <span class="score-pill tier-{{ tier(h.score) }}">{{ S.outOf100(h.score) }}</span>
            <span class="history-date">
              <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>
              <time [attr.datetime]="h.ratedOn">{{ h.ratedOn | date: 'dd MMM y' }}</time>
            </span>
            <span class="history-meta">
              {{ S.historyPrevious(h.previous ?? S.HISTORY_FIRST_RATING) }}<ng-container *ngIf="h.source">
                · {{ S.historySource(h.source) }}</ng-container
              >
              · <strong>{{ S.historyBy(h.ratedBy) }}</strong>
            </span>
          </li>
        </ul>
        <ng-template #noHistory><p class="empty">{{ S.HISTORY_EMPTY }}</p></ng-template>
      </section>
    </div>

    <!-- ======================= Edit ======================= -->
    <div class="page" *ngIf="mode() === 'edit'">
      <div class="head">
        <div class="head-text">
          <span class="material-symbols-outlined head-icon" aria-hidden="true">edit_note</span>
          <h2 class="title" tabindex="-1" data-edit-title>{{ S.EDIT_TITLE }}</h2>
          <p class="subtitle">{{ S.EDIT_SUBTITLE }}</p>
        </div>
        <div class="head-badges">
          <span class="head-badge prev">{{ S.PREVIOUS_RATING }}: <strong>{{ S.outOf100(previousOverall()) }}</strong></span>
          <span class="head-badge now" aria-live="polite">{{ S.CURRENT_RATING_NEW }}: <strong>{{ S.outOf100(draftOverall()) }}</strong></span>
        </div>
      </div>

      <div class="edit-grid">
        <!-- Category accordion: one open at a time. -->
        <div class="accordion">
          <section class="acc-item" *ngFor="let c of categories(); let i = index; trackBy: trackCategory" [class.open]="openIndex() === i">
            <h3 class="acc-head">
              <button
                type="button"
                class="acc-toggle"
                [id]="ids.accHead + i"
                [attr.aria-expanded]="openIndex() === i"
                [attr.aria-controls]="ids.accBody + i"
                (click)="toggle(i)"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">{{ openIndex() === i ? 'expand_more' : 'chevron_right' }}</span>
                <span class="acc-name">{{ c.name }}</span>
                <span class="acc-score">{{ draftScores()[i] }}{{ S.OUT_OF_10_SPACED }}</span>
              </button>
            </h3>
            <div class="acc-body" role="region" [id]="ids.accBody + i" [attr.aria-labelledby]="ids.accHead + i" *ngIf="openIndex() === i">
              <div>
                <span class="field-label req" [id]="ids.scoreLabel + i">{{ S.RATING_RANGE_LABEL }}</span>
                <div class="score-grid" role="group" [attr.aria-labelledby]="ids.scoreLabel + i">
                  <button
                    type="button"
                    class="score-btn"
                    *ngFor="let n of scoreOptions"
                    [class.selected]="draftScores()[i] === n"
                    [attr.aria-pressed]="draftScores()[i] === n"
                    [attr.aria-label]="S.scoreButtonLabel(c.name, n)"
                    (click)="setScore(i, n)"
                  >
                    {{ n }}
                  </button>
                </div>
              </div>
              <div>
                <label class="field-label" [for]="ids.catRemarks + i">{{ S.REMARKS_OPTIONAL }}</label>
                <textarea
                  class="tohfa-input"
                  rows="4"
                  [id]="ids.catRemarks + i"
                  [attr.maxlength]="remarksMax"
                  [attr.aria-describedby]="ids.catCounter + i"
                  [placeholder]="S.CATEGORY_REMARKS_PLACEHOLDER"
                  [value]="draftRemarks()[i] ?? ''"
                  (input)="setCategoryRemarks(i, $event)"
                ></textarea>
                <p class="counter" [id]="ids.catCounter + i">{{ S.counter((draftRemarks()[i] ?? '').length, remarksMax) }}</p>
              </div>
            </div>
          </section>
        </div>

        <div class="side">
          <section class="overall tier-{{ tier(draftOverall()) }}" [attr.aria-labelledby]="ids.updated">
            <p class="overall-label" [id]="ids.updated">{{ S.UPDATED_OVERALL_RATING }}</p>
            <p class="overall-value">
              <span class="overall-num">{{ draftOverall() }}</span><span class="overall-of">{{ S.OUT_OF_100 }}</span>
            </p>
            <p class="overall-prev">
              {{ S.previousLine(previousOverall()) }}<span class="sep" aria-hidden="true">|</span
              ><span class="change">{{ S.changeLine(signed(change())) }}</span>
            </p>
            <div class="progress">
              <div
                class="track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-valuenow]="draftOverall()"
                [attr.aria-label]="S.UPDATED_OVERALL_RATING"
              >
                <div class="fill" [style.width.%]="draftOverall()"></div>
              </div>
              <span class="pct" aria-hidden="true">{{ S.percent(draftOverall()) }}</span>
            </div>
          </section>

          <section class="tohfa-card" [attr.aria-labelledby]="ids.details">
            <h3 class="card-title" [id]="ids.details">
              <span class="material-symbols-outlined icon amber" aria-hidden="true">event</span>{{ S.DETAILS_TITLE }}
            </h3>
            <div class="details-grid">
              <div>
                <label class="field-label req" [for]="ids.date">{{ S.RATING_DATE }}</label>
                <div class="input-icon">
                  <span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>
                  <input
                    type="date"
                    class="tohfa-input"
                    required
                    [id]="ids.date"
                    [value]="ratedOn()"
                    [attr.aria-invalid]="showErrors() && !ratedOn() ? 'true' : null"
                    [attr.aria-describedby]="showErrors() && !ratedOn() ? ids.date + '-err' : null"
                    (input)="ratedOn.set(valueOf($event))"
                  />
                </div>
                <p class="field-error" [id]="ids.date + '-err'" *ngIf="showErrors() && !ratedOn()">{{ S.REQUIRED_DATE }}</p>
              </div>
              <div>
                <label class="field-label req" [for]="ids.source">{{ S.SOURCE }}</label>
                <select
                  class="tohfa-input"
                  required
                  [id]="ids.source"
                  [attr.aria-invalid]="showErrors() && !source() ? 'true' : null"
                  [attr.aria-describedby]="showErrors() && !source() ? ids.source + '-err' : null"
                  (change)="source.set(valueOf($event))"
                >
                  <option value="" [selected]="!source()">{{ S.SOURCE_PLACEHOLDER }}</option>
                  <option *ngFor="let o of sourceOptions" [value]="o" [selected]="o === source()">{{ o }}</option>
                </select>
                <p class="field-error" [id]="ids.source + '-err'" *ngIf="showErrors() && !source()">{{ S.REQUIRED_SOURCE }}</p>
              </div>
              <div class="full">
                <label class="field-label req" [for]="ids.ratedBy">{{ S.RATED_BY }}</label>
                <input
                  type="text"
                  class="tohfa-input"
                  required
                  [id]="ids.ratedBy"
                  [placeholder]="S.RATED_BY_PLACEHOLDER"
                  [value]="ratedBy()"
                  [attr.aria-invalid]="showErrors() && !ratedBy().trim() ? 'true' : null"
                  [attr.aria-describedby]="showErrors() && !ratedBy().trim() ? ids.ratedBy + '-err' : null"
                  (input)="ratedBy.set(valueOf($event))"
                />
                <p class="field-error" [id]="ids.ratedBy + '-err'" *ngIf="showErrors() && !ratedBy().trim()">{{ S.REQUIRED_RATED_BY }}</p>
              </div>
              <div class="full">
                <label class="field-label" [for]="ids.remarks">{{ S.REMARKS_OPTIONAL }}</label>
                <textarea
                  class="tohfa-input"
                  rows="4"
                  [id]="ids.remarks"
                  [attr.maxlength]="remarksMax"
                  [attr.aria-describedby]="ids.remarks + '-count'"
                  [placeholder]="S.UPDATE_REMARKS_PLACEHOLDER"
                  [value]="remarks()"
                  (input)="remarks.set(valueOf($event))"
                ></textarea>
                <p class="counter" [id]="ids.remarks + '-count'">{{ S.counter(remarks().length, remarksMax) }}</p>
              </div>
            </div>
          </section>

          <div class="edit-actions">
            <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="cancelEdit()">{{ S.BTN_CANCEL }}</button>
            <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="requestSave()">
              <span class="material-symbols-outlined icon" aria-hidden="true">check</span>{{ S.BTN_SAVE_RATING }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================= Save Rating? dialog ======================= -->
    <div class="tohfa-dialog-scrim" *ngIf="confirmOpen()" (click)="closeConfirm()">
      <div
        class="tohfa-dialog dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="ids.dialogTitle"
        [attr.aria-describedby]="ids.dialogSub"
        tohfaDialogFocus
        (dialogClose)="closeConfirm()"
        (click)="$event.stopPropagation()"
      >
        <button type="button" class="dialog-close" [attr.aria-label]="S.BTN_CLOSE" (click)="closeConfirm()">
          <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
        </button>

        <span class="hero" aria-hidden="true"><span class="material-symbols-outlined icon">star</span></span>
        <h2 class="dialog-title" [id]="ids.dialogTitle">{{ S.DIALOG_TITLE }}</h2>
        <p class="dialog-sub" [id]="ids.dialogSub">{{ S.aboutToUpdate(farmerName || S.DEFAULT_FARMER_NAME) }}</p>

        <div class="compare">
          <div>
            <span class="compare-label">{{ S.PREVIOUS_RATING }}</span>
            <span class="compare-value">{{ S.outOf100(previousOverall()) }}</span>
          </div>
          <span class="material-symbols-outlined compare-arrow" aria-hidden="true">arrow_forward</span>
          <div>
            <span class="compare-label">{{ S.NEW_RATING }}</span>
            <span class="compare-value" [ngClass]="changeTone()">{{ S.outOf100(draftOverall()) }}</span>
          </div>
          <span class="chip" [ngClass]="changeTone()">
            <span class="chip-line">
              <span class="material-symbols-outlined icon" aria-hidden="true">{{ changeIcon() }}</span>{{ signed(change()) }}
            </span>
            <small>{{ changeLabel() }}</small>
          </span>
        </div>

        <dl class="summary">
          <div>
            <dt><span class="material-symbols-outlined icon" aria-hidden="true">calendar_today</span>{{ S.RATING_DATE }}</dt>
            <dd>{{ ratedOn() | date: 'dd MMM y' }}</dd>
          </div>
          <div>
            <dt><span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.SOURCE }}</dt>
            <dd>{{ source() }}</dd>
          </div>
          <div>
            <dt><span class="material-symbols-outlined icon" aria-hidden="true">person</span>{{ S.RATED_BY }}</dt>
            <dd>{{ ratedBy().trim() }}</dd>
          </div>
        </dl>

        <p class="remarks-label">
          <span class="material-symbols-outlined icon" aria-hidden="true">chat_bubble</span>{{ S.REMARKS }}
        </p>
        <p class="remarks-box">{{ remarks().trim() || S.DASH }}</p>

        <p class="note">
          <span class="material-symbols-outlined icon" aria-hidden="true">check_circle</span>{{ S.DIALOG_NOTE }}
        </p>

        <div class="dialog-actions">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="closeConfirm()">{{ S.BTN_CANCEL }}</button>
          <button type="button" class="tohfa-btn tohfa-btn-primary-l" data-autofocus (click)="confirmSave()">
            <span class="material-symbols-outlined icon" aria-hidden="true">check</span>{{ S.BTN_CONFIRM_SAVE }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FarmerRatingsTabComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Shown in the confirmation dialog: "You're about to update {farmerName}'s farmer rating." */
  @Input() farmerName: string = S.DEFAULT_FARMER_NAME;

  readonly S = S;
  readonly scoreOptions = SCORE_OPTIONS;
  readonly remarksMax = RATING_REMARKS_MAX;
  readonly sourceOptions = FARMER_RATINGS_MOCK.sourceOptions;

  readonly ids = (() => {
    const p = `farmer-ratings-${nextRatingsId++}`;
    return {
      overall: `${p}-overall`,
      categories: `${p}-categories`,
      history: `${p}-history`,
      updated: `${p}-updated`,
      details: `${p}-details`,
      accHead: `${p}-acc-head-`,
      accBody: `${p}-acc-body-`,
      scoreLabel: `${p}-score-label-`,
      catRemarks: `${p}-cat-remarks-`,
      catCounter: `${p}-cat-counter-`,
      date: `${p}-date`,
      source: `${p}-source`,
      ratedBy: `${p}-rated-by`,
      remarks: `${p}-remarks`,
      dialogTitle: `${p}-dialog-title`,
      dialogSub: `${p}-dialog-sub`,
    };
  })();

  // ---------- Saved state (local only; see the file header) ----------
  readonly categories = signal<readonly FarmerRatingCategory[]>(FARMER_RATINGS_MOCK.categories);
  readonly previousOverall = signal(FARMER_RATINGS_MOCK.previousOverall);
  readonly history = signal<readonly FarmerRatingHistoryEntry[]>(FARMER_RATINGS_MOCK.history);
  /** The overall rating is the sum of the ten category scores, out of 100. */
  readonly overall = computed(() => sum(this.categories().map((c) => c.score)));

  // ---------- View / edit state ----------
  readonly mode = signal<Mode>('view');
  readonly draftScores = signal<readonly number[]>([]);
  readonly draftRemarks = signal<readonly string[]>([]);
  readonly openIndex = signal<number | null>(0);
  readonly ratedOn = signal('');
  readonly source = signal('');
  readonly ratedBy = signal('');
  readonly remarks = signal('');
  readonly showErrors = signal(false);
  readonly confirmOpen = signal(false);

  readonly draftOverall = computed(() => sum(this.draftScores()));
  /** Change is measured against the stored previous overall, as in the design (Previous 68 → Current 78 = +10). */
  readonly change = computed(() => this.draftOverall() - this.previousOverall());
  readonly changeTone = computed<ChangeTone>(() => (this.change() > 0 ? 'up' : this.change() < 0 ? 'down' : 'none'));
  readonly changeIcon = computed(() => ({ up: 'trending_up', down: 'trending_down', none: 'trending_flat' })[this.changeTone()]);
  readonly changeLabel = computed(() => ({ up: S.CHANGE_UP, down: S.CHANGE_DOWN, none: S.CHANGE_NONE })[this.changeTone()]);
  private readonly formValid = computed(() => this.ratedOn() !== '' && this.source() !== '' && this.ratedBy().trim() !== '');

  tier(overall: number): Tier {
    return tierOf(overall);
  }

  signed(delta: number): string {
    return S.signed(delta);
  }

  /** "01", "02" … as in the design's # column. */
  index2(i: number): string {
    return pad2(i + 1);
  }

  trackCategory(_: number, c: FarmerRatingCategory): string {
    return c.id;
  }

  trackHistory(_: number, h: FarmerRatingHistoryEntry): string {
    return h.id;
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  // ---------- View → edit ----------

  startEdit(): void {
    const cats = this.categories();
    const d = FARMER_RATINGS_MOCK.updateDefaults;
    this.draftScores.set(cats.map((c) => c.score));
    this.draftRemarks.set(cats.map((c) => c.remarks));
    this.openIndex.set(0);
    this.ratedOn.set(d.ratedOn);
    this.source.set(d.source);
    this.ratedBy.set(d.ratedBy);
    this.remarks.set(d.remarks);
    this.showErrors.set(false);
    this.mode.set('edit');
    this.focusLater('[data-edit-title]');
  }

  toggle(i: number): void {
    this.openIndex.update((open) => (open === i ? null : i));
  }

  setScore(i: number, score: number): void {
    this.draftScores.update((s) => s.map((v, j) => (j === i ? score : v)));
  }

  setCategoryRemarks(i: number, event: Event): void {
    const value = this.valueOf(event);
    this.draftRemarks.update((r) => r.map((v, j) => (j === i ? value : v)));
  }

  /** Discards the draft; nothing was saved. */
  cancelEdit(): void {
    this.mode.set('view');
    this.focusLater('[data-edit-rating]');
  }

  requestSave(): void {
    if (!this.formValid()) {
      this.showErrors.set(true);
      return;
    }
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
  }

  /** Applies the draft locally: new scores, previous = the overall being replaced, a new history row. */
  confirmSave(): void {
    if (!this.formValid()) return;
    const replaced = this.overall();
    const scores = this.draftScores();
    const remarks = this.draftRemarks();
    const entry: FarmerRatingHistoryEntry = {
      id: `local-${Date.now()}`,
      score: this.draftOverall(),
      ratedOn: this.ratedOn(),
      previous: String(replaced),
      source: this.source(),
      ratedBy: this.ratedBy().trim(),
    };
    this.categories.update((cats) => cats.map((c, i) => ({ ...c, score: scores[i] ?? c.score, remarks: remarks[i] ?? c.remarks })));
    this.previousOverall.set(replaced);
    this.history.update((h) => [entry, ...h]);
    this.confirmOpen.set(false);
    this.mode.set('view');
    // The dialog's opener (Save Rating) is gone with the edit view, so focus the view's heading.
    this.focusLater('[data-view-title]');
  }

  /** Moves focus once the *ngIf'd view has rendered; the element it would return to no longer exists. */
  private focusLater(selector: string): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus());
  }
}
