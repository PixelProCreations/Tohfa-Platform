/**
 * Farmer Records → Diary → Edit Diary Entry (SA-M3-S10a). Renders the same form blank as
 * "Add Diary Entry" when no `entry` is given.
 *
 * UI ONLY. There is no admin (on-behalf) diary write endpoint yet, so nothing is sent anywhere: Save
 * validates locally and emits the draft through `saved`; the host decides what to do with it. Option
 * lists and limits come from `farmer-diary-edit.mock.ts`, which cites where each one came from in the
 * farmer-facing spec. Photos are placeholder tiles only — "Add Photo" adds a tile, it never opens a
 * file chooser or loads an image.
 *
 * When integrated, the contract goes into docs/openapi.yaml, the route gets its own `requirePermission`
 * code in docs/rbac.json, the write lands in audit_log, and the wage is sent as integer paise.
 */
import { CommonModule, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  LOCALE_ID,
  Output,
  computed,
  inject,
  signal,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { FarmerDiaryEntry } from './farmer-records.mock';
import {
  DIARY_CATEGORIES,
  DIARY_CROPS,
  DIARY_EDIT_LIMITS,
  DIARY_ENTRY_DETAILS,
  DIARY_PLOTS,
  DIARY_WORKERS,
  type DiaryCategoryOption,
} from './farmer-diary-edit.mock';
import { FARMER_DIARY_EDIT_STRINGS as S } from './farmer-diary-edit.strings';

/** One workforce line. Hours and wage stay strings so no float arithmetic ever touches them. */
export interface FarmerDiaryEditWorkerLine {
  readonly workerId: string;
  /** Decimal hours as typed, e.g. "4" or "2.5" (> 0, ≤ 24, ≤ 2 decimals). */
  readonly hours: string;
  /** Whole rupees as a digit string, e.g. "600". */
  readonly wageRupees: string;
}

/** What `saved` emits. */
export interface FarmerDiaryEditDraft {
  /** The edited entry's id, or null for a new entry. */
  readonly entryId: string | null;
  /** ISO date (yyyy-MM-dd). */
  readonly date: string;
  readonly plotId: string;
  readonly categoryKey: string;
  readonly activityKey: string;
  readonly minutes: number;
  readonly linkedCropId: string | null;
  readonly workers: readonly FarmerDiaryEditWorkerLine[];
  readonly notes: string;
  /** Placeholder photo tiles kept on the entry. */
  readonly photoCount: number;
}

interface WorkerRow {
  readonly uid: number;
  workerId: string;
  hours: string;
  wageRupees: string;
}

type FieldKey = 'date' | 'plot' | 'category' | 'activity' | 'minutes';

const L = DIARY_EDIT_LIMITS;
const DIGITS = /^\d+$/;
const HOURS = /^(\d{1,2})(?:\.(\d{1,2}))?$/;
const WAGE = new RegExp(`^[1-9]\\d{0,${L.wageMaxChars - 1}}$`);

/** > 0 and ≤ 24 with at most two decimals, compared as integers (no float parsing). */
function validHours(value: string): boolean {
  const m = HOURS.exec(value.trim());
  if (!m) return false;
  const whole = Number(m[1]);
  const frac = Number((m[2] ?? '0').padEnd(2, '0'));
  if (whole > L.hoursMax || (whole === L.hoursMax && frac > 0)) return false;
  return whole > 0 || frac > 0;
}

function findCategory(label: string): DiaryCategoryOption | undefined {
  return DIARY_CATEGORIES.find((c) => c.label === label || c.aliases?.includes(label));
}

let nextDiaryEditId = 0;

@Component({
  selector: 'tohfa-farmer-diary-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
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

      /* ---------- Header ---------- */
      .head {
        display: flex;
        align-items: flex-start;
        gap: var(--space-12);
      }
      .back {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: var(--tohfa-min-touch-target);
        height: var(--tohfa-min-touch-target);
        margin-top: calc(var(--space-8) * -1);
        border: none;
        border-radius: var(--r-sm);
        background: none;
        color: var(--tohfa-ink);
        cursor: pointer;
      }
      .back .icon {
        font-size: var(--icon-dialog-close);
      }
      .back:hover {
        background: var(--tohfa-amber-tint);
      }
      .back:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .title {
        margin: 0;
        font-size: var(--fs-title);
        font-weight: var(--fw-xbold);
        line-height: 1.2;
      }
      .subtitle {
        margin: var(--space-6) 0 0;
        font-size: var(--fs-dense);
        color: var(--tohfa-slate);
      }

      /* ---------- Card ---------- */
      .card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        padding: var(--space-28);
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        min-width: 0;
      }
      .col-left {
        padding-right: var(--space-28);
      }
      .col-right {
        padding-left: var(--space-28);
        border-left: var(--border-divider);
      }
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
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .tohfa-input {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--fs-body);
      }
      .tohfa-input.invalid {
        border-color: var(--err);
      }
      select.tohfa-input {
        appearance: none;
        padding-right: var(--space-32);
        cursor: pointer;
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
      /* The native picker indicator is laid invisibly over the calendar icon so clicking it still opens the picker. */
      input[type='date'] {
        padding-right: var(--space-32);
      }
      input[type='date']::-webkit-calendar-picker-indicator {
        position: absolute;
        right: var(--space-12);
        opacity: 0;
        cursor: pointer;
      }
      .suffix {
        position: absolute;
        right: var(--space-14);
        padding: var(--space-4) var(--space-10);
        border-radius: var(--r-xs);
        background: var(--tohfa-page);
        color: var(--tohfa-slate);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        pointer-events: none;
      }
      .with-suffix {
        padding-right: calc(var(--space-32) * 3);
      }
      textarea.tohfa-input {
        min-height: calc(var(--space-28) * 3);
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

      /* ---------- Workforce ---------- */
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-12);
        margin-bottom: var(--space-8);
      }
      .section-head .field-label {
        margin: 0;
      }
      .link-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-amber);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .link-btn:hover:not(:disabled) {
        color: var(--tohfa-amber-hover);
      }
      .link-btn:disabled {
        color: var(--tohfa-disabled-fg);
        cursor: not-allowed;
      }
      .link-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .wf {
        border: var(--border-card);
        border-radius: var(--r-md);
        overflow: hidden;
      }
      .wf table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .wf th {
        padding: var(--space-12) var(--space-14);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-table-header);
        font-weight: var(--fw-xbold);
        letter-spacing: 0.3px;
        text-align: left;
        text-transform: uppercase;
      }
      .wf td {
        padding: var(--space-8) var(--space-6);
        vertical-align: top;
      }
      .wf td:first-child {
        padding-left: var(--space-14);
      }
      .wf .c-worker {
        width: 40%;
      }
      .wf .c-hours,
      .wf .c-wage {
        width: 23%;
      }
      .wf .c-del {
        width: 14%;
      }
      .wf .tohfa-input {
        min-height: calc(var(--space-18) * 2);
        padding-top: var(--space-6);
        padding-bottom: var(--space-6);
      }
      .wf .field-error {
        font-size: var(--fs-badge);
      }
      .del-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-18) * 2);
        height: calc(var(--space-18) * 2);
        margin: 0 auto;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--err);
        cursor: pointer;
      }
      .wf td.c-del {
        text-align: center;
      }
      .del-btn:hover {
        background: var(--err-bg);
      }
      .del-btn:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .wf-empty {
        margin: 0;
        padding: var(--space-14);
        font-size: var(--fs-dense);
        color: var(--tohfa-muted);
      }

      /* ---------- Photos ---------- */
      .photos {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-10);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .tile {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-20) * 5);
        height: calc(var(--space-20) * 5);
        border-radius: var(--r-md);
      }
      .tile-photo {
        border: 1px solid var(--neutral-status-bd);
        background: var(--neutral-status-bg);
        color: var(--tohfa-muted);
      }
      .tile-photo > .icon {
        font-size: var(--icon-dialog-hero);
      }
      .tile-x {
        position: absolute;
        top: var(--space-6);
        right: var(--space-6);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--space-20);
        height: var(--space-20);
        padding: 0;
        border: none;
        border-radius: var(--r-circle);
        background: var(--tohfa-ink);
        color: var(--tohfa-surface);
        cursor: pointer;
      }
      .tile-x .icon {
        font-size: var(--icon-row-action);
      }
      .tile-x:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .tile-add {
        flex-direction: column;
        gap: var(--space-6);
        border: 1px dashed var(--tohfa-amber-border);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-amber);
        font-family: var(--font);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .tile-add .icon {
        font-size: var(--icon-dialog-close);
      }
      .tile-add:hover:not(:disabled) {
        border-color: var(--tohfa-amber);
      }
      .tile-add:disabled {
        border-color: var(--tohfa-border);
        background: var(--tohfa-disabled-bg);
        color: var(--tohfa-disabled-fg);
        cursor: not-allowed;
      }
      .tile-add:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      /* ---------- Info strip ---------- */
      .info {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-10) var(--space-28);
        margin: 0;
        padding: var(--space-14) var(--space-20);
        border-radius: var(--r-md);
        background: var(--tohfa-amber-tint);
        font-size: var(--fs-dense);
        list-style: none;
      }
      .info li {
        display: inline-flex;
        align-items: center;
        gap: var(--space-8);
      }
      .info li + li {
        padding-left: var(--space-28);
        border-left: 1px solid var(--tohfa-amber-border);
      }
      .info .icon {
        color: var(--tohfa-brown);
      }

      /* ---------- Footer ---------- */
      .form-error {
        margin: 0;
        font-size: var(--fs-cell);
        color: var(--err);
        text-align: right;
      }
      .foot {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-12);
        margin-top: var(--space-18);
        padding: var(--space-18) var(--space-28);
        border-top: var(--border-divider);
        background: var(--tohfa-surface);
      }
      .foot .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }

      @media (max-width: 900px) {
        .card {
          grid-template-columns: minmax(0, 1fr);
          padding: var(--space-18);
        }
        .col-left {
          padding-right: 0;
          padding-bottom: var(--space-18);
        }
        .col-right {
          padding-left: 0;
          padding-top: var(--space-18);
          border-left: none;
          border-top: var(--border-divider);
        }
        .info li + li {
          padding-left: 0;
          border-left: none;
        }
        .foot {
          padding: var(--space-16);
        }
      }
    `,
  ],
  template: `
    <header class="head">
      <button type="button" class="back" [attr.aria-label]="S.BTN_BACK" [title]="S.BTN_BACK" (click)="back.emit()">
        <span class="material-symbols-outlined icon" aria-hidden="true">arrow_back</span>
      </button>
      <div>
        <h2 class="title" [id]="ids.title">{{ isEdit() ? S.TITLE_EDIT : S.TITLE_ADD }}</h2>
        <p class="subtitle">{{ S.SUBTITLE }}</p>
      </div>
    </header>

    <form class="tohfa-card card" novalidate [attr.aria-labelledby]="ids.title" (ngSubmit)="save()">
      <!-- ================= Left column ================= -->
      <div class="col col-left">
        <div class="field">
          <label class="field-label" [for]="ids.date">{{ S.DATE }} <span class="req" aria-hidden="true">*</span></label>
          <div class="control">
            <input
              type="date"
              class="tohfa-input"
              name="date"
              [id]="ids.date"
              required
              aria-required="true"
              [class.invalid]="err('date')"
              [attr.aria-invalid]="err('date') ? 'true' : null"
              [attr.aria-describedby]="err('date') ? ids.date + '-err' : null"
              [ngModel]="date()"
              (ngModelChange)="date.set($event ?? '')"
            />
            <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
          </div>
          <p class="field-error" *ngIf="err('date') as e" [id]="ids.date + '-err'">{{ e }}</p>
        </div>

        <div class="field">
          <label class="field-label" [for]="ids.plot">{{ S.PLOT }} <span class="req" aria-hidden="true">*</span></label>
          <div class="control">
            <select
              class="tohfa-input"
              name="plot"
              [id]="ids.plot"
              required
              aria-required="true"
              [class.invalid]="err('plot')"
              [attr.aria-invalid]="err('plot') ? 'true' : null"
              [attr.aria-describedby]="err('plot') ? ids.plot + '-err' : null"
              [ngModel]="plotId()"
              (ngModelChange)="onPlot($event)"
            >
              <option value="" disabled>{{ S.PLOT_PLACEHOLDER }}</option>
              <option *ngFor="let p of plots" [value]="p.id">{{ S.plotOption(p.name, p.areaAcres) }}</option>
            </select>
            <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
          </div>
          <p class="field-error" *ngIf="err('plot') as e" [id]="ids.plot + '-err'">{{ e }}</p>
        </div>

        <div class="field">
          <label class="field-label" [for]="ids.category">{{ S.CATEGORY }} <span class="req" aria-hidden="true">*</span></label>
          <div class="control">
            <select
              class="tohfa-input"
              name="category"
              [id]="ids.category"
              required
              aria-required="true"
              [class.invalid]="err('category')"
              [attr.aria-invalid]="err('category') ? 'true' : null"
              [attr.aria-describedby]="err('category') ? ids.category + '-err' : null"
              [ngModel]="categoryKey()"
              (ngModelChange)="onCategory($event)"
            >
              <option value="" disabled>{{ S.CATEGORY_PLACEHOLDER }}</option>
              <option *ngFor="let c of categories" [value]="c.key">{{ c.label }}</option>
            </select>
            <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
          </div>
          <p class="field-error" *ngIf="err('category') as e" [id]="ids.category + '-err'">{{ e }}</p>
        </div>

        <div class="field">
          <label class="field-label" [for]="ids.activity">{{ S.ACTIVITY }} <span class="req" aria-hidden="true">*</span></label>
          <div class="control">
            <select
              class="tohfa-input"
              name="activity"
              [id]="ids.activity"
              required
              aria-required="true"
              [disabled]="activities().length === 0"
              [class.invalid]="err('activity')"
              [attr.aria-invalid]="err('activity') ? 'true' : null"
              [attr.aria-describedby]="err('activity') ? ids.activity + '-err' : null"
              [ngModel]="activityKey()"
              (ngModelChange)="activityKey.set($event ?? '')"
            >
              <option value="" disabled>
                {{ activities().length === 0 ? S.ACTIVITY_PLACEHOLDER_NO_CATEGORY : S.ACTIVITY_PLACEHOLDER }}
              </option>
              <option *ngFor="let a of activities()" [value]="a.key">{{ a.label }}</option>
            </select>
            <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
          </div>
          <p class="field-error" *ngIf="err('activity') as e" [id]="ids.activity + '-err'">{{ e }}</p>
        </div>

        <div class="field">
          <label class="field-label" [for]="ids.minutes">{{ S.MINUTES }} <span class="req" aria-hidden="true">*</span></label>
          <div class="control">
            <input
              type="text"
              inputmode="numeric"
              class="tohfa-input with-suffix"
              name="minutes"
              autocomplete="off"
              [id]="ids.minutes"
              required
              aria-required="true"
              [attr.maxlength]="limits.minutesMaxChars"
              [placeholder]="S.MINUTES_PLACEHOLDER"
              [class.invalid]="err('minutes')"
              [attr.aria-invalid]="err('minutes') ? 'true' : null"
              [attr.aria-describedby]="ids.minutes + '-suffix' + (err('minutes') ? ' ' + ids.minutes + '-err' : '')"
              [ngModel]="minutes()"
              (ngModelChange)="minutes.set(digitsOnly($event))"
            />
            <span class="suffix" [id]="ids.minutes + '-suffix'">{{ S.MINUTES_SUFFIX }}</span>
          </div>
          <p class="field-error" *ngIf="err('minutes') as e" [id]="ids.minutes + '-err'">{{ e }}</p>
        </div>

        <div class="field">
          <label class="field-label" [for]="ids.crop">{{ S.LINKED_CROP }}</label>
          <div class="control">
            <select
              class="tohfa-input"
              name="crop"
              [id]="ids.crop"
              [ngModel]="linkedCropId()"
              (ngModelChange)="linkedCropId.set($event ?? '')"
            >
              <option value="">{{ S.LINKED_CROP_NONE }}</option>
              <option *ngFor="let c of crops()" [value]="c.id">{{ S.cropOption(c.name) }}</option>
            </select>
            <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
          </div>
        </div>
      </div>

      <!-- ================= Right column ================= -->
      <div class="col col-right">
        <section [attr.aria-labelledby]="ids.wf">
          <div class="section-head">
            <h3 class="field-label" [id]="ids.wf">{{ S.WORKFORCE }}</h3>
            <button type="button" class="link-btn" [disabled]="workers().length >= limits.workersMax" (click)="addWorker()">
              <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD_WORKER }}
            </button>
          </div>
          <div class="wf">
            <table>
              <thead>
                <tr>
                  <th scope="col" class="c-worker">{{ S.COL_WORKER }}</th>
                  <th scope="col" class="c-hours">{{ S.COL_HOURS }}</th>
                  <th scope="col" class="c-wage">{{ S.COL_WAGE }}</th>
                  <th scope="col" class="c-del"><span class="sr-only">{{ S.COL_REMOVE }}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let w of workers(); let i = index; trackBy: trackWorker" [attr.aria-label]="S.workerRowLabel(i + 1)">
                  <td>
                    <div class="control">
                      <select
                        class="tohfa-input"
                        [name]="'worker-' + w.uid"
                        [id]="ids.row + w.uid + '-worker'"
                        required
                        aria-required="true"
                        [attr.aria-label]="S.workerSelectLabel(i + 1)"
                        [class.invalid]="rowErr(w.uid, 'worker')"
                        [attr.aria-invalid]="rowErr(w.uid, 'worker') ? 'true' : null"
                        [attr.aria-describedby]="rowErr(w.uid, 'worker') ? ids.row + w.uid + '-worker-err' : null"
                        [ngModel]="w.workerId"
                        (ngModelChange)="patchWorker(w.uid, { workerId: $event ?? '' })"
                      >
                        <option value="" disabled>{{ S.WORKER_PLACEHOLDER }}</option>
                        <option *ngFor="let o of workerOptions" [value]="o.id">{{ o.name }}</option>
                      </select>
                      <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                    </div>
                    <p class="field-error" *ngIf="rowErr(w.uid, 'worker') as e" [id]="ids.row + w.uid + '-worker-err'">{{ e }}</p>
                  </td>
                  <td>
                    <input
                      type="text"
                      inputmode="decimal"
                      class="tohfa-input"
                      autocomplete="off"
                      [name]="'hours-' + w.uid"
                      required
                      aria-required="true"
                      [attr.maxlength]="limits.hoursMaxChars"
                      [attr.aria-label]="S.hoursLabel(i + 1)"
                      [class.invalid]="rowErr(w.uid, 'hours')"
                      [attr.aria-invalid]="rowErr(w.uid, 'hours') ? 'true' : null"
                      [attr.aria-describedby]="rowErr(w.uid, 'hours') ? ids.row + w.uid + '-hours-err' : null"
                      [ngModel]="w.hours"
                      (ngModelChange)="patchWorker(w.uid, { hours: decimalOnly($event) })"
                    />
                    <p class="field-error" *ngIf="rowErr(w.uid, 'hours') as e" [id]="ids.row + w.uid + '-hours-err'">{{ e }}</p>
                  </td>
                  <td>
                    <input
                      type="text"
                      inputmode="numeric"
                      class="tohfa-input"
                      autocomplete="off"
                      [name]="'wage-' + w.uid"
                      required
                      aria-required="true"
                      [attr.maxlength]="limits.wageMaxChars"
                      [attr.aria-label]="S.wageLabel(i + 1)"
                      [class.invalid]="rowErr(w.uid, 'wage')"
                      [attr.aria-invalid]="rowErr(w.uid, 'wage') ? 'true' : null"
                      [attr.aria-describedby]="rowErr(w.uid, 'wage') ? ids.row + w.uid + '-wage-err' : null"
                      [ngModel]="w.wageRupees"
                      (ngModelChange)="patchWorker(w.uid, { wageRupees: digitsOnly($event) })"
                    />
                    <p class="field-error" *ngIf="rowErr(w.uid, 'wage') as e" [id]="ids.row + w.uid + '-wage-err'">{{ e }}</p>
                  </td>
                  <td class="c-del">
                    <button
                      type="button"
                      class="del-btn"
                      [attr.aria-label]="S.removeWorker(i + 1)"
                      [title]="S.removeWorker(i + 1)"
                      (click)="removeWorker(w.uid)"
                    >
                      <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="wf-empty" *ngIf="workers().length === 0">{{ S.NO_WORKERS }}</p>
          </div>
        </section>

        <div class="field">
          <label class="field-label" [for]="ids.notes">{{ S.NOTES }}</label>
          <textarea
            class="tohfa-input"
            name="notes"
            rows="3"
            [id]="ids.notes"
            [attr.maxlength]="limits.notesMax"
            [attr.aria-describedby]="ids.notes + '-counter'"
            [placeholder]="S.NOTES_PLACEHOLDER"
            [ngModel]="notes()"
            (ngModelChange)="notes.set(($event ?? '').slice(0, limits.notesMax))"
          ></textarea>
          <span class="counter" [id]="ids.notes + '-counter'" [attr.aria-label]="S.counterAria(notes().length, limits.notesMax)">
            {{ S.counter(notes().length, limits.notesMax) }}
          </span>
        </div>

        <section [attr.aria-labelledby]="ids.photos">
          <h3 class="field-label" [id]="ids.photos">{{ S.PHOTOS }}</h3>
          <ul class="photos">
            <li *ngFor="let p of photos(); let i = index; trackBy: trackPhoto">
              <span class="tile tile-photo" role="img" [attr.aria-label]="S.photoLabel(i + 1)">
                <span class="material-symbols-outlined icon" aria-hidden="true">image</span>
              </span>
              <button
                type="button"
                class="tile-x"
                [attr.aria-label]="S.removePhoto(i + 1)"
                [title]="S.removePhoto(i + 1)"
                (click)="removePhoto(p)"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
              </button>
            </li>
            <li>
              <!-- Local placeholder only: adds a neutral tile, never opens a file chooser. -->
              <button type="button" class="tile tile-add" [disabled]="photos().length >= limits.photosMax" (click)="addPhoto()">
                <span class="material-symbols-outlined icon" aria-hidden="true">add_a_photo</span>{{ S.BTN_ADD_PHOTO }}
              </button>
            </li>
          </ul>
          <p class="sr-only" aria-live="polite">{{ S.photosRemaining(photos().length, limits.photosMax) }}</p>
        </section>
      </div>
    </form>

    <ul class="info" *ngIf="audit() as a">
      <li>
        <span class="material-symbols-outlined icon" aria-hidden="true">group</span>{{ S.addedBy(a.addedBy, a.onBehalf) }}
      </li>
      <li *ngIf="a.lastUpdated">
        <span class="material-symbols-outlined icon" aria-hidden="true">schedule</span>{{ a.lastUpdated }}
      </li>
    </ul>

    <div class="foot">
      <p class="form-error" *ngIf="submitted() && hasErrors()" role="alert">{{ S.ERR_FORM }}</p>
      <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="back.emit()">{{ S.BTN_CANCEL }}</button>
      <button type="button" class="tohfa-btn tohfa-btn-primary-l" (click)="save()">
        <span class="material-symbols-outlined icon" aria-hidden="true">save</span>{{ S.BTN_SAVE }}
      </button>
    </div>
  `,
})
export class FarmerDiaryEditComponent implements OnChanges {
  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The diary entry being edited. Absent / null renders the blank "Add Diary Entry" form. */
  @Input() entry: FarmerDiaryEntry | null = null;
  /** The farmer the entry belongs to. Not rendered by the design; kept for the future API call. */
  @Input() farmerName = '';
  @Output() readonly back = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<FarmerDiaryEditDraft>();

  readonly S = S;
  readonly limits = L;
  readonly plots = DIARY_PLOTS;
  readonly categories = DIARY_CATEGORIES;
  readonly workerOptions = DIARY_WORKERS;

  private readonly uid = nextDiaryEditId++;
  readonly ids = {
    title: `de-title-${this.uid}`,
    date: `de-date-${this.uid}`,
    plot: `de-plot-${this.uid}`,
    category: `de-category-${this.uid}`,
    activity: `de-activity-${this.uid}`,
    minutes: `de-minutes-${this.uid}`,
    crop: `de-crop-${this.uid}`,
    wf: `de-wf-${this.uid}`,
    row: `de-row-${this.uid}-`,
    notes: `de-notes-${this.uid}`,
    photos: `de-photos-${this.uid}`,
  };

  private nextRow = 0;

  readonly date = signal('');
  readonly plotId = signal('');
  readonly categoryKey = signal('');
  readonly activityKey = signal('');
  readonly minutes = signal('');
  readonly linkedCropId = signal('');
  readonly notes = signal('');
  readonly workers = signal<readonly WorkerRow[]>([]);
  /** Placeholder photo tiles, identified by a local counter. */
  readonly photos = signal<readonly number[]>([]);
  readonly submitted = signal(false);
  private readonly lastUpdatedAt = signal<string | null>(null);
  private readonly lastUpdatedBy = signal('');

  readonly isEdit = computed(() => this.entryId() !== null);
  private readonly entryId = signal<string | null>(null);
  private readonly entrySnapshot = signal<FarmerDiaryEntry | null>(null);

  readonly activities = computed(() => this.categories.find((c) => c.key === this.categoryKey())?.activities ?? []);
  readonly crops = computed(() => DIARY_CROPS.filter((c) => c.plotId === this.plotId()));

  readonly audit = computed(() => {
    const e = this.entrySnapshot();
    if (!e) return null;
    const at = this.lastUpdatedAt();
    return {
      addedBy: e.addedBy,
      onBehalf: e.onBehalf,
      lastUpdated: at ? S.lastUpdated(formatDate(at, 'd MMM y, hh:mm a', this.locale, 'UTC'), this.lastUpdatedBy()) : null,
    };
  });

  private readonly fieldErrors = computed<Partial<Record<FieldKey, string>>>(() => {
    const errors: Partial<Record<FieldKey, string>> = {};
    if (!this.date()) errors.date = S.ERR_REQUIRED;
    if (!this.plotId()) errors.plot = S.ERR_REQUIRED;
    if (!this.categoryKey()) errors.category = S.ERR_REQUIRED;
    if (!this.activityKey()) errors.activity = S.ERR_REQUIRED;
    const m = this.minutes();
    if (!m) errors.minutes = S.ERR_REQUIRED;
    else if (!DIGITS.test(m) || Number(m) < L.minutesMin || Number(m) > L.minutesMax) {
      errors.minutes = S.minutesRange(L.minutesMin, L.minutesMax);
    }
    return errors;
  });

  private readonly rowErrors = computed(() => {
    const out = new Map<string, string>();
    for (const w of this.workers()) {
      if (!w.workerId) out.set(`${w.uid}:worker`, S.ERR_SELECT_WORKER);
      if (!w.hours) out.set(`${w.uid}:hours`, S.ERR_REQUIRED);
      else if (!validHours(w.hours)) out.set(`${w.uid}:hours`, S.hoursRange(L.hoursMax));
      if (!w.wageRupees) out.set(`${w.uid}:wage`, S.ERR_REQUIRED);
      else if (!WAGE.test(w.wageRupees)) out.set(`${w.uid}:wage`, S.wageWhole);
    }
    return out;
  });

  readonly hasErrors = computed(() => Object.keys(this.fieldErrors()).length > 0 || this.rowErrors().size > 0);

  ngOnChanges(changes: SimpleChanges): void {
    // Only a new entry resets the form; a farmerName change must not wipe the admin's edits.
    if (changes['entry']) this.load(this.entry);
  }

  err(key: FieldKey): string | null {
    return this.submitted() ? (this.fieldErrors()[key] ?? null) : null;
  }

  rowErr(uid: number, key: 'worker' | 'hours' | 'wage'): string | null {
    return this.submitted() ? (this.rowErrors().get(`${uid}:${key}`) ?? null) : null;
  }

  onPlot(id: string | null): void {
    this.plotId.set(id ?? '');
    // The linked crop must be on the chosen plot (BR-42b).
    if (!DIARY_CROPS.some((c) => c.id === this.linkedCropId() && c.plotId === this.plotId())) this.linkedCropId.set('');
  }

  onCategory(key: string | null): void {
    this.categoryKey.set(key ?? '');
    if (!this.activities().some((a) => a.key === this.activityKey())) this.activityKey.set('');
  }

  addWorker(): void {
    if (this.workers().length >= L.workersMax) return;
    const uid = this.nextRow++;
    this.workers.update((rows) => [...rows, { uid, workerId: '', hours: '', wageRupees: '' }]);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${this.ids.row}${uid}-worker`)?.focus());
  }

  removeWorker(uid: number): void {
    this.workers.update((rows) => rows.filter((r) => r.uid !== uid));
  }

  patchWorker(uid: number, patch: Partial<Omit<WorkerRow, 'uid'>>): void {
    this.workers.update((rows) => rows.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  }

  addPhoto(): void {
    if (this.photos().length >= L.photosMax) return;
    this.photos.update((p) => [...p, this.nextRow++]);
  }

  removePhoto(id: number): void {
    this.photos.update((p) => p.filter((x) => x !== id));
  }

  digitsOnly(value: string | null): string {
    return (value ?? '').replace(/\D/g, '');
  }

  decimalOnly(value: string | null): string {
    const cleaned = (value ?? '').replace(/[^\d.]/g, '');
    const dot = cleaned.indexOf('.');
    return dot < 0 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
  }

  trackWorker(_: number, w: WorkerRow): number {
    return w.uid;
  }

  trackPhoto(_: number, id: number): number {
    return id;
  }

  save(): void {
    this.submitted.set(true);
    if (this.hasErrors()) {
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    this.saved.emit({
      entryId: this.entryId(),
      date: this.date(),
      plotId: this.plotId(),
      categoryKey: this.categoryKey(),
      activityKey: this.activityKey(),
      minutes: Number(this.minutes()),
      linkedCropId: this.linkedCropId() || null,
      workers: this.workers().map(({ workerId, hours, wageRupees }) => ({ workerId, hours: hours.trim(), wageRupees })),
      notes: this.notes().trim(),
      photoCount: this.photos().length,
    });
  }

  /** Fills the form from a Diary list entry plus its placeholder detail; blank when there is none. */
  private load(e: FarmerDiaryEntry | null): void {
    this.submitted.set(false);
    this.entryId.set(e?.id ?? null);
    this.entrySnapshot.set(e);
    const d = e ? DIARY_ENTRY_DETAILS[e.id] : undefined;

    const category = d ? this.categories.find((c) => c.key === d.categoryKey) : e ? findCategory(e.category) : undefined;
    const activity = d
      ? category?.activities.find((a) => a.key === d.activityKey)
      : category?.activities.find((a) => a.label === e?.activity || a.aliases?.includes(e?.activity ?? ''));
    const plot = d ? DIARY_PLOTS.find((p) => p.id === d.plotId) : DIARY_PLOTS.find((p) => p.name === e?.plot.name);

    this.date.set(e?.date ?? '');
    this.plotId.set(plot?.id ?? '');
    this.categoryKey.set(category?.key ?? '');
    this.activityKey.set(activity?.key ?? '');
    this.minutes.set(e ? String(e.durationMinutes) : '');
    this.linkedCropId.set(
      d?.linkedCropId ?? DIARY_CROPS.find((c) => c.name === e?.linkedCrop && c.plotId === plot?.id)?.id ?? '',
    );
    this.notes.set(d?.notes ?? '');
    this.workers.set((d?.workers ?? []).map((w) => ({ uid: this.nextRow++, ...w })));
    this.photos.set(Array.from({ length: Math.min(d?.photoCount ?? e?.photoCount ?? 0, L.photosMax) }, () => this.nextRow++));
    this.lastUpdatedAt.set(d?.lastUpdatedAt ?? null);
    this.lastUpdatedBy.set(d?.lastUpdatedBy ?? '');
  }
}
