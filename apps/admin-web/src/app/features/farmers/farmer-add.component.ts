/**
 * Farmers Management → Add Farmer Profile (SA-M3-S02d).
 *
 * The inputs are the farmer application's field set (mobile registration step 1 "personal",
 * step 2 "farm details", step 3 "locations" and step 4 "documents"), with the application's
 * option lists and validation. Save is wired to the only admin create endpoint in
 * docs/openapi.yaml, `createAdminFarmer` (POST /v1/admin/farmers, `farmer.profile.edit`), which
 * creates an ACTIVE, approved farmer from: fullName, mobile, email, zoneId, village, taluk,
 * district, pincode, aadhaarLast4 and addressLine1. Date of birth, gender and address line 2 are
 * not in that body, so they follow in one `updateAdminFarmer` PATCH (same permission) on the new
 * id. The API writes the audit row for each call in its own transaction.
 *
 * SPEC GAPS (no admin endpoint stores them, so they never leave this page):
 * - identity proof type, farming type (`typeOfFarming`), farm name / total area / number of farms
 *   (step 2) and the plots / zones with their boundaries (step 3 `locations`) — kept as an honest
 *   local draft and called out beside the Save button;
 * - document uploads (step 4) — disabled: application uploads are signed by the farmer's own
 *   application, and no admin endpoint attaches a document to a farmer;
 * - "Full name as per document", "Date of birth (as per document)", the plot's land shape, main
 *   crop and notes — in no schema at all, rendered disabled;
 * - "+ Add" beside each picker — the option lists are the application's fixed lists.
 *
 * The full Aadhaar number is held only in this component, shown masked, never logged and never
 * sent: only its last four digits go to the API (BR-33b).
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '../../core/auth.interceptor';
import { DialogFocusDirective } from './dialog-focus.directive';
import { FarmerFmbDialogComponent } from './farmer-fmb-dialog.component';
import { FmbSketchComponent } from './farmer-fmb-sketch.component';
import { FarmerPlotDialogComponent } from './farmer-plot-dialog.component';
import { FARMER_ADD_STRINGS as S } from './farmer-add.strings';
import { formatAcres, isPositioned, nextPlotId, type DraftPlot } from './farmer-add.model';
import {
  FarmersService,
  type AdminFarmerCreateRequest,
  type AdminFarmerUpdateRequest,
  type AdminZoneListItem,
} from './farmers.service';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

type FieldKey =
  | 'fullName'
  | 'mobile'
  | 'email'
  | 'dob'
  | 'gender'
  | 'idProofType'
  | 'aadhaar'
  | 'addressLine1'
  | 'addressLine2'
  | 'village'
  | 'taluk'
  | 'pincode'
  | 'district'
  | 'zoneId'
  | 'farmingType'
  | 'farmName'
  | 'totalArea'
  | 'plotsRecorded';

interface FormModel {
  fullName: string;
  /** Ten local digits; sent as `+91…`. */
  mobile: string;
  email: string;
  /** `YYYY-MM-DD`. */
  dob: string;
  gender: Gender | '';
  idProofType: string;
  /** Twelve digits, held in memory only. Never sent; only the last four are. */
  aadhaar: string;
  addressLine1: string;
  addressLine2: string;
  village: string;
  taluk: string;
  pincode: string;
  district: string;
  zoneId: string;
  farmingType: string;
  farmName: string;
  totalArea: number | string | null;
  plotsRecorded: number | string | null;
}

type SectionKey = 'personal' | 'identity' | 'upload' | 'address' | 'zone' | 'farm' | 'fmb' | 'docs';

interface ChecklistItem {
  key: SectionKey;
  label: string;
  done: boolean;
  /** True when the section cannot be completed yet (spec gap). */
  unavailable: boolean;
}

/** Limits from createAdminFarmer / updateAdminFarmer and the application's step schemas. */
const LIMITS = {
  fullNameMin: 2,
  fullNameMax: 120,
  emailMax: 254,
  /** createAdminFarmer `addressLine1` is max 200, tighter than the application's 300. */
  addressMax: 200,
  placeMax: 120,
  farmNameMax: 120,
  maxAcres: 10_000_000,
} as const;

const MOBILE_LOCAL = /^[6-9]\d{9}$/;
const PINCODE = /^[1-9][0-9]{5}$/;
const AADHAAR = /^\d{12}$/;
/** Deliberately loose: the API's Zod `.email()` is the authority; this only catches typos early. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIA_PREFIX = '+91';
const DEFAULT_DISTRICT = 'The Nilgiris';
/** The mobile registration's step-2 default. */
const DEFAULT_FARMING_TYPE = 'Organic';
const GENDER_CHOICES: readonly Gender[] = ['MALE', 'FEMALE', 'OTHER'];
/** How long the success / partial banner shows before navigating to the new farmer. */
const REDIRECT_MS = 900;

/** createAdminFarmer / updateAdminFarmer body keys → form keys, for 422 field errors. */
const FIELD_FROM_API: Readonly<Record<string, FieldKey>> = {
  fullName: 'fullName',
  mobile: 'mobile',
  email: 'email',
  zoneId: 'zoneId',
  village: 'village',
  taluk: 'taluk',
  district: 'district',
  pincode: 'pincode',
  aadhaarLast4: 'aadhaar',
  addressLine1: 'addressLine1',
  addressLine2: 'addressLine2',
  dob: 'dob',
  gender: 'gender',
};

const SECTION_FIELDS: Readonly<Record<'personal' | 'identity' | 'address' | 'zone' | 'farm', readonly FieldKey[]>> = {
  personal: ['fullName', 'mobile', 'email', 'dob', 'gender'],
  identity: ['idProofType', 'aadhaar'],
  address: ['addressLine1', 'addressLine2', 'village', 'taluk', 'pincode', 'district'],
  zone: ['zoneId', 'farmingType'],
  farm: ['farmName', 'totalArea', 'plotsRecorded'],
};

/** Only these block Save: they are what the create + follow-up PATCH actually persist. */
const SAVED_FIELDS: readonly FieldKey[] = [
  'fullName',
  'mobile',
  'email',
  'dob',
  'gender',
  'aadhaar',
  'addressLine1',
  'addressLine2',
  'village',
  'taluk',
  'pincode',
  'district',
  'zoneId',
];

@Component({
  selector: 'tohfa-farmer-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogFocusDirective,
    FarmerPlotDialogComponent,
    FarmerFmbDialogComponent,
    FmbSketchComponent,
  ],
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
      [aria-disabled='true'] {
        cursor: not-allowed;
      }

      /* ---------- Page header ---------- */
      .page-title {
        margin: 0 0 var(--space-8);
        font-size: var(--fs-title);
        font-weight: var(--fw-bold);
        line-height: 1.2;
      }
      .page-subtitle {
        margin: 0;
        font-size: var(--fs-body);
        color: var(--tohfa-slate);
      }
      .banner-row {
        margin: 0;
      }

      /* ---------- Layout ---------- */
      form {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
      }
      .layout {
        display: grid;
        grid-template-columns: var(--layout-register-row);
        gap: var(--space-18);
        align-items: start;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        min-width: 0;
      }
      .sticky {
        position: sticky;
        top: var(--space-18);
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        margin: 0 0 var(--space-18);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
        color: var(--tohfa-brown);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-ink);
      }

      /* ---------- Fields ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-14) var(--space-14);
      }
      .full {
        grid-column: 1 / -1;
      }
      .field {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .field .tohfa-label {
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
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
      .tohfa-input.invalid,
      .group.invalid {
        border-color: var(--err);
      }
      .tohfa-input:disabled {
        cursor: not-allowed;
      }
      .with-trail {
        padding-right: var(--space-32);
      }
      .trail {
        position: absolute;
        right: var(--space-12);
        font-size: var(--icon-input);
        color: var(--tohfa-muted);
        pointer-events: none;
      }
      button.trail {
        pointer-events: auto;
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        display: inline-flex;
        cursor: pointer;
      }
      button.trail:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      select.tohfa-input {
        appearance: none;
        cursor: pointer;
      }
      select.tohfa-input:disabled {
        cursor: not-allowed;
      }
      input[type='date']::-webkit-calendar-picker-indicator {
        position: absolute;
        right: var(--space-10);
        opacity: 0;
        cursor: pointer;
      }
      .field-error {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--err);
      }
      .field-hint {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }

      /* Prefix (+91) and suffix (acres) groups share the input's frame. */
      .group {
        display: flex;
        align-items: stretch;
        border: var(--border-input);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-surface);
        overflow: hidden;
      }
      .group:focus-within {
        border-color: var(--tohfa-amber);
        box-shadow: var(--tohfa-focus-ring);
      }
      .group .tohfa-input {
        border: none;
        border-radius: 0;
        box-shadow: none;
      }
      .affix {
        display: inline-flex;
        align-items: center;
        padding: 0 var(--space-12);
        background: var(--tohfa-page);
        color: var(--tohfa-slate);
        font-size: var(--fs-dense);
      }
      .affix.prefix {
        border-right: var(--border-input);
      }
      .affix.suffix {
        border-left: var(--border-input);
      }

      /* Picker + Add + chips row. */
      .picker {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: var(--space-10) var(--space-14);
      }
      .picker .control {
        flex: 0 1 calc(var(--space-32) * 5);
        min-width: calc(var(--space-32) * 4.5);
      }
      .picker.wide .control {
        flex: 1 1 100%;
      }
      .add-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
        padding: 0 var(--space-18);
      }
      .add-btn .icon {
        font-size: var(--icon-row-action);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-8);
        min-height: var(--tohfa-min-touch-target);
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: var(--space-6);
        padding: var(--space-6) var(--space-10);
        border-radius: var(--r-xs);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
      }
      .chip button {
        display: inline-flex;
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: inherit;
        cursor: pointer;
      }
      .chip button:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .chip .icon {
        font-size: var(--icon-row-action);
      }

      /* ---------- Upload zones (disabled: spec gap) ---------- */
      .dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-6);
        width: 100%;
        min-height: calc(var(--space-32) * 4);
        border: var(--border-dropzone);
        border-radius: var(--r-md);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-family: var(--font);
        text-align: center;
      }
      .dropzone .icon {
        color: var(--tohfa-amber);
        font-size: var(--icon-nav);
      }
      .dropzone-title {
        font-size: var(--fs-body);
        font-weight: var(--fw-bold);
      }
      .dropzone-hint {
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .add-doc {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-8);
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        border: var(--border-dropzone);
        border-radius: var(--r-md);
        background: none;
        color: var(--tohfa-amber);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
      }

      /* ---------- Farm FMB & Zones on Map ---------- */
      .fmb {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--space-14);
        align-items: start;
      }
      .mini {
        position: relative;
        height: calc(var(--space-24) * 5);
      }
      .mini-sketch {
        height: 100%;
      }
      .mini-chip {
        position: absolute;
        right: var(--space-8);
        bottom: var(--space-8);
        padding: var(--space-4) var(--space-8);
        border-radius: var(--r-xs);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
      }
      .plot-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-10);
      }
      .plot-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4) var(--space-10);
        font-size: var(--fs-dense);
      }
      .plot-name {
        font-weight: var(--fw-bold);
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .row-links {
        display: inline-flex;
        gap: var(--space-12);
      }
      .row-link {
        padding: 0;
        border: none;
        border-radius: var(--r-xs);
        background: none;
        color: var(--tohfa-brown);
        font-family: var(--font);
        font-size: var(--fs-dense);
        font-weight: var(--fw-bold);
        cursor: pointer;
      }
      .row-link.danger {
        color: var(--err);
      }
      .row-link:focus-visible {
        outline: none;
        box-shadow: var(--tohfa-focus-ring);
      }
      .add-plot {
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
        justify-content: center;
      }

      /* ---------- Registration Summary ---------- */
      .summary-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-10);
        padding-bottom: var(--space-14);
        border-bottom: var(--border-divider);
      }
      .summary-label {
        font-size: var(--fs-cap);
        font-weight: var(--fw-bold);
        color: var(--tohfa-slate);
      }
      .summary-hint {
        display: block;
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .farmer-id {
        font-size: var(--fs-body);
        font-weight: var(--fw-xbold);
      }
      .status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: var(--space-14) 0 var(--space-18);
      }
      .checklist-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-14);
        font-size: var(--fs-body);
        font-weight: var(--fw-bold);
      }
      .checklist {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .check {
        display: flex;
        align-items: center;
        gap: var(--space-10);
        font-size: var(--fs-dense);
        font-weight: var(--fw-semi);
      }
      .dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: var(--space-20);
        height: var(--space-20);
        border: var(--border-checkbox);
        border-radius: var(--r-circle);
        color: var(--tohfa-neutral-white);
      }
      .check.done .dot {
        border-color: var(--tohfa-primary);
        background: var(--tohfa-primary);
      }
      .check.unavailable {
        color: var(--tohfa-muted);
      }
      .dot .icon {
        font-size: var(--icon-row-action);
      }

      /* ---------- Footer actions (not sticky, per design) ---------- */
      .form-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-12);
      }
      .draft-note {
        flex: 1 1 320px;
        margin: 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .form-actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }

      /* ---------- Confirm dialogs ---------- */
      .dialog-title {
        margin: 0 0 var(--space-8);
        font-size: var(--fs-title-dialog);
        font-weight: var(--fw-bold);
      }
      .dialog-body {
        margin: 0 0 var(--space-18);
        color: var(--tohfa-slate);
        font-size: var(--fs-body);
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-10);
      }
      .dialog-actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
    `,
  ],
  template: `
    <header>
      <h1 class="page-title">{{ S.TITLE }}</h1>
      <p class="page-subtitle">{{ S.SUBTITLE }}</p>
    </header>

    <p class="tohfa-banner tohfa-banner-danger banner-row" *ngIf="zonesError()" role="alert">{{ S.ZONES_ERROR }}</p>
    <p class="tohfa-banner tohfa-banner-success banner-row" *ngIf="saved()" role="status">{{ S.SAVE_SUCCESS }}</p>
    <p class="tohfa-banner tohfa-banner-warning banner-row" *ngIf="partial()" role="status">{{ S.SAVE_PARTIAL }}</p>
    <p class="tohfa-banner tohfa-banner-danger banner-row" *ngIf="formError() as msg" role="alert">{{ msg }}</p>

    <form novalidate (ngSubmit)="save()">
      <div class="layout">
        <!-- ================= Column 1 ================= -->
        <div class="col">
          <section class="tohfa-card" aria-labelledby="fa-personal-title">
            <h2 class="card-title" id="fa-personal-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">person</span>{{ S.PERSONAL }}
            </h2>
            <div class="grid">
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-fullName">{{ S.FULL_NAME }}</label>
                <input
                  id="fa-fullName"
                  name="fullName"
                  class="tohfa-input"
                  [class.invalid]="errors()['fullName']"
                  [maxLength]="limits.fullNameMax"
                  [placeholder]="S.FULL_NAME_PLACEHOLDER"
                  autocomplete="off"
                  [(ngModel)]="form.fullName"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['fullName'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-mobile">{{ S.MOBILE }}</label>
                <div class="group" [class.invalid]="errors()['mobile']">
                  <span class="affix prefix" aria-hidden="true">{{ S.MOBILE_PREFIX }}</span>
                  <input
                    id="fa-mobile"
                    name="mobile"
                    class="tohfa-input"
                    inputmode="numeric"
                    maxlength="10"
                    autocomplete="off"
                    [placeholder]="S.MOBILE_PLACEHOLDER"
                    [(ngModel)]="form.mobile"
                    (ngModelChange)="onDigits('mobile', $event, 10)"
                  />
                </div>
                <p class="field-error" *ngIf="errors()['mobile'] as e">{{ e }}</p>
              </div>

              <div class="field">
                <label class="tohfa-label" for="fa-email">{{ S.EMAIL }}</label>
                <input
                  id="fa-email"
                  name="email"
                  type="email"
                  class="tohfa-input"
                  [class.invalid]="errors()['email']"
                  [maxLength]="limits.emailMax"
                  [placeholder]="S.EMAIL_PLACEHOLDER"
                  autocomplete="off"
                  [(ngModel)]="form.email"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['email'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-dob">{{ S.DOB }}</label>
                <div class="control">
                  <input
                    id="fa-dob"
                    name="dob"
                    type="date"
                    class="tohfa-input with-trail"
                    [class.invalid]="errors()['dob']"
                    [max]="today"
                    [(ngModel)]="form.dob"
                    (ngModelChange)="touched()"
                  />
                  <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
                </div>
                <p class="field-error" *ngIf="errors()['dob'] as e">{{ e }}</p>
              </div>

              <div class="field full">
                <label class="tohfa-label tohfa-label-required" for="fa-gender">{{ S.GENDER }}</label>
                <div class="picker">
                  <div class="control">
                    <select
                      id="fa-gender"
                      name="gender"
                      class="tohfa-input with-trail"
                      [class.invalid]="errors()['gender']"
                      [(ngModel)]="form.gender"
                      (ngModelChange)="touched()"
                    >
                      <option value="" disabled>{{ S.GENDER_PLACEHOLDER }}</option>
                      <option *ngFor="let g of genderChoices" [value]="g">{{ S.GENDER_OPTIONS[g] }}</option>
                    </select>
                    <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                  </div>
                  <ng-container *ngTemplateOutlet="addBtn; context: { tip: S.ADD_OPTION_NOT_AVAILABLE }"></ng-container>
                  <ng-container *ngTemplateOutlet="chip; context: { label: form.gender ? S.GENDER_OPTIONS[form.gender] : '', field: 'gender' }"></ng-container>
                </div>
                <p class="field-error" *ngIf="errors()['gender'] as e">{{ e }}</p>
              </div>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="fa-upload-title">
            <h2 class="card-title" id="fa-upload-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">upload_file</span>{{ S.DOCUMENT_UPLOAD }}
            </h2>
            <button type="button" class="dropzone" aria-disabled="true" [title]="S.UPLOAD_NOT_AVAILABLE">
              <span class="material-symbols-outlined icon" aria-hidden="true">upload</span>
              <span class="dropzone-title">{{ S.UPLOAD_TITLE }}</span>
              <span class="dropzone-hint">{{ S.UPLOAD_HINT }}</span>
            </button>
          </section>

          <section class="tohfa-card" aria-labelledby="fa-zone-title">
            <h2 class="card-title" id="fa-zone-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">stacks</span>{{ S.ZONE_FARM }}
            </h2>
            <div class="grid">
              <div class="field full">
                <label class="tohfa-label tohfa-label-required" for="fa-zone">{{ S.ZONE }}</label>
                <div class="picker">
                  <div class="control">
                    <select
                      id="fa-zone"
                      name="zoneId"
                      class="tohfa-input with-trail"
                      [class.invalid]="errors()['zoneId']"
                      [(ngModel)]="form.zoneId"
                      (ngModelChange)="touched()"
                    >
                      <option value="" disabled>{{ S.ZONE_PLACEHOLDER }}</option>
                      <option *ngFor="let z of zones()" [value]="z.id">{{ z.name }}</option>
                    </select>
                    <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                  </div>
                  <ng-container *ngTemplateOutlet="addBtn; context: { tip: S.ZONE_ADD_NOT_AVAILABLE }"></ng-container>
                  <ng-container *ngTemplateOutlet="chip; context: { label: selectedZone()?.name ?? '', field: 'zoneId' }"></ng-container>
                </div>
                <p class="field-error" *ngIf="errors()['zoneId'] as e">{{ e }}</p>
              </div>
              <div class="field full">
                <label class="tohfa-label" for="fa-warehouse">{{ S.WAREHOUSE }}</label>
                <div class="control" [title]="S.WAREHOUSE_FROM_ZONE">
                  <select id="fa-warehouse" class="tohfa-input with-trail" disabled>
                    <option>{{ selectedZone()?.warehouseName ?? S.WAREHOUSE_PLACEHOLDER }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div class="field full">
                <label class="tohfa-label tohfa-label-required" for="fa-farmingType">{{ S.FARMING_TYPE }}</label>
                <div class="picker">
                  <div class="control">
                    <select
                      id="fa-farmingType"
                      name="farmingType"
                      class="tohfa-input with-trail"
                      [class.invalid]="errors()['farmingType']"
                      [(ngModel)]="form.farmingType"
                      (ngModelChange)="touched()"
                    >
                      <option value="" disabled>{{ S.FARMING_TYPE_PLACEHOLDER }}</option>
                      <option *ngFor="let t of S.FARMING_TYPE_OPTIONS" [value]="t">{{ t }}</option>
                    </select>
                    <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                  </div>
                  <ng-container *ngTemplateOutlet="addBtn; context: { tip: S.ADD_OPTION_NOT_AVAILABLE }"></ng-container>
                  <ng-container *ngTemplateOutlet="chip; context: { label: form.farmingType, field: 'farmingType' }"></ng-container>
                </div>
                <p class="field-error" *ngIf="errors()['farmingType'] as e">{{ e }}</p>
              </div>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="fa-fmb-title">
            <h2 class="card-title" id="fa-fmb-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">map</span>{{ S.FMB_CARD }}
            </h2>
            <div class="fmb">
              <div class="mini">
                <tohfa-fmb-sketch class="mini-sketch" [plots]="plots()" [compact]="true"></tohfa-fmb-sketch>
                <span class="mini-chip">{{ hasGeometry() ? S.MAP_CHIP : S.MAP_CHIP_EMPTY }}</span>
              </div>
              <div class="plot-list">
                <div class="plot-row" *ngIf="plots().length === 0">
                  <span class="plot-name">{{ S.NO_PLOTS }}</span>
                </div>
                <div class="plot-row" *ngFor="let p of plots()">
                  <span class="plot-name">{{ S.plotRow(p.id, p.label, acres(p.areaAcres)) }}</span>
                  <span class="row-links">
                    <button type="button" class="row-link" [attr.aria-label]="S.viewPlot(p.label)" (click)="openFmb(p)">{{ S.VIEW }}</button>
                    <button type="button" class="row-link" [attr.aria-label]="S.editPlot(p.label)" (click)="openPlot(p)">{{ S.EDIT }}</button>
                    <button type="button" class="row-link danger" [attr.aria-label]="S.deletePlot(p.label)" (click)="deleteTarget.set(p)">
                      {{ S.DELETE }}
                    </button>
                  </span>
                </div>
                <button type="button" class="tohfa-btn tohfa-btn-outline-amber add-plot" (click)="openPlot(null)">
                  <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.ADD_PLOT }}
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- ================= Column 2 ================= -->
        <div class="col">
          <section class="tohfa-card" aria-labelledby="fa-identity-title">
            <h2 class="card-title" id="fa-identity-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">badge</span>{{ S.IDENTITY }}
            </h2>
            <div class="grid">
              <div class="field full">
                <label class="tohfa-label tohfa-label-required" for="fa-idProof">{{ S.ID_PROOF_TYPE }}</label>
                <div class="picker wide">
                  <div class="control">
                    <select
                      id="fa-idProof"
                      name="idProofType"
                      class="tohfa-input with-trail"
                      [class.invalid]="errors()['idProofType']"
                      [(ngModel)]="form.idProofType"
                      (ngModelChange)="touched()"
                    >
                      <option value="" disabled>{{ S.ID_PROOF_PLACEHOLDER }}</option>
                      <option *ngFor="let o of S.ID_PROOF_OPTIONS" [value]="o">{{ o }}</option>
                    </select>
                    <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                  </div>
                  <ng-container *ngTemplateOutlet="addBtn; context: { tip: S.ADD_OPTION_NOT_AVAILABLE }"></ng-container>
                  <ng-container *ngTemplateOutlet="chip; context: { label: form.idProofType, field: 'idProofType' }"></ng-container>
                </div>
                <p class="field-error" *ngIf="errors()['idProofType'] as e">{{ e }}</p>
              </div>
              <div class="field full">
                <label class="tohfa-label" for="fa-docName">{{ S.DOC_NAME }}</label>
                <input id="fa-docName" class="tohfa-input" [placeholder]="S.DOC_NAME_PLACEHOLDER" disabled [title]="S.NO_SPEC_FIELD" />
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-aadhaar">{{ S.AADHAAR }}</label>
                <div class="control">
                  <!-- Masked by default; the number never leaves this component (BR-33b). -->
                  <input
                    id="fa-aadhaar"
                    name="aadhaar"
                    class="tohfa-input with-trail"
                    [type]="showAadhaar() ? 'text' : 'password'"
                    [class.invalid]="errors()['aadhaar']"
                    inputmode="numeric"
                    maxlength="12"
                    autocomplete="off"
                    spellcheck="false"
                    aria-describedby="fa-aadhaar-hint"
                    [placeholder]="S.AADHAAR_PLACEHOLDER"
                    [(ngModel)]="form.aadhaar"
                    (ngModelChange)="onDigits('aadhaar', $event, 12)"
                  />
                  <button
                    type="button"
                    class="material-symbols-outlined trail"
                    [attr.aria-label]="showAadhaar() ? S.AADHAAR_HIDE : S.AADHAAR_SHOW"
                    [attr.aria-pressed]="showAadhaar()"
                    [title]="showAadhaar() ? S.AADHAAR_HIDE : S.AADHAAR_SHOW"
                    (click)="showAadhaar.set(!showAadhaar())"
                  >
                    {{ showAadhaar() ? 'visibility' : 'visibility_off' }}
                  </button>
                </div>
                <p class="field-error" *ngIf="errors()['aadhaar'] as e; else aadhaarHint">{{ e }}</p>
                <ng-template #aadhaarHint><p class="field-hint" id="fa-aadhaar-hint">{{ S.AADHAAR_HINT }}</p></ng-template>
              </div>
              <div class="field">
                <label class="tohfa-label" for="fa-docDob">{{ S.DOC_DOB }}</label>
                <div class="control" [title]="S.NO_SPEC_FIELD">
                  <input id="fa-docDob" type="date" class="tohfa-input with-trail" disabled />
                  <span class="material-symbols-outlined trail" aria-hidden="true">calendar_today</span>
                </div>
              </div>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="fa-address-title">
            <h2 class="card-title" id="fa-address-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>{{ S.ADDRESS }}
            </h2>
            <div class="grid">
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-address1">{{ S.ADDRESS_LINE1 }}</label>
                <input
                  id="fa-address1"
                  name="addressLine1"
                  class="tohfa-input"
                  [class.invalid]="errors()['addressLine1']"
                  [maxLength]="limits.addressMax"
                  [placeholder]="S.ADDRESS_LINE1_PLACEHOLDER"
                  [(ngModel)]="form.addressLine1"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['addressLine1'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label" for="fa-address2">{{ S.ADDRESS_LINE2 }}</label>
                <input
                  id="fa-address2"
                  name="addressLine2"
                  class="tohfa-input"
                  [class.invalid]="errors()['addressLine2']"
                  [maxLength]="limits.addressMax"
                  [placeholder]="S.ADDRESS_LINE2_PLACEHOLDER"
                  [(ngModel)]="form.addressLine2"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['addressLine2'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-village">{{ S.VILLAGE }}</label>
                <input
                  id="fa-village"
                  name="village"
                  class="tohfa-input"
                  [class.invalid]="errors()['village']"
                  [maxLength]="limits.placeMax"
                  [placeholder]="S.VILLAGE_PLACEHOLDER"
                  [(ngModel)]="form.village"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['village'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-taluk">{{ S.TALUK }}</label>
                <input
                  id="fa-taluk"
                  name="taluk"
                  class="tohfa-input"
                  [class.invalid]="errors()['taluk']"
                  [maxLength]="limits.placeMax"
                  [placeholder]="S.TALUK_PLACEHOLDER"
                  [(ngModel)]="form.taluk"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['taluk'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-pincode">{{ S.PINCODE }}</label>
                <input
                  id="fa-pincode"
                  name="pincode"
                  class="tohfa-input"
                  [class.invalid]="errors()['pincode']"
                  inputmode="numeric"
                  maxlength="6"
                  [placeholder]="S.PINCODE_PLACEHOLDER"
                  [(ngModel)]="form.pincode"
                  (ngModelChange)="onDigits('pincode', $event, 6)"
                />
                <p class="field-error" *ngIf="errors()['pincode'] as e">{{ e }}</p>
              </div>
              <div class="field full">
                <label class="tohfa-label tohfa-label-required" for="fa-district">{{ S.DISTRICT }}</label>
                <div class="picker">
                  <div class="control">
                    <select
                      id="fa-district"
                      name="district"
                      class="tohfa-input with-trail"
                      [class.invalid]="errors()['district']"
                      [(ngModel)]="form.district"
                      (ngModelChange)="touched()"
                    >
                      <option value="" disabled>{{ S.SELECT_PLACEHOLDER }}</option>
                      <option *ngFor="let d of S.DISTRICT_OPTIONS" [value]="d">{{ d }}</option>
                    </select>
                    <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                  </div>
                  <ng-container *ngTemplateOutlet="addBtn; context: { tip: S.ADD_OPTION_NOT_AVAILABLE }"></ng-container>
                  <ng-container *ngTemplateOutlet="chip; context: { label: form.district, field: 'district' }"></ng-container>
                </div>
                <p class="field-error" *ngIf="errors()['district'] as e">{{ e }}</p>
              </div>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="fa-farm-title">
            <h2 class="card-title" id="fa-farm-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">eco</span>{{ S.FARM_DETAILS }}
            </h2>
            <div class="grid">
              <div class="field full">
                <label class="tohfa-label tohfa-label-required" for="fa-farmName">{{ S.FARM_NAME }}</label>
                <input
                  id="fa-farmName"
                  name="farmName"
                  class="tohfa-input"
                  [class.invalid]="errors()['farmName']"
                  [maxLength]="limits.farmNameMax"
                  [placeholder]="S.FARM_NAME_PLACEHOLDER"
                  [(ngModel)]="form.farmName"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['farmName'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-totalArea">{{ S.TOTAL_AREA }}</label>
                <div class="group" [class.invalid]="errors()['totalArea']">
                  <input
                    id="fa-totalArea"
                    name="totalArea"
                    type="number"
                    min="0"
                    step="0.01"
                    inputmode="decimal"
                    class="tohfa-input"
                    [placeholder]="S.TOTAL_AREA_PLACEHOLDER"
                    [(ngModel)]="form.totalArea"
                    (ngModelChange)="touched()"
                  />
                  <span class="affix suffix" aria-hidden="true">{{ S.ACRES }}</span>
                </div>
                <p class="field-error" *ngIf="errors()['totalArea'] as e">{{ e }}</p>
              </div>
              <div class="field">
                <label class="tohfa-label tohfa-label-required" for="fa-plotsRecorded">{{ S.PLOTS_RECORDED }}</label>
                <input
                  id="fa-plotsRecorded"
                  name="plotsRecorded"
                  type="number"
                  min="1"
                  step="1"
                  inputmode="numeric"
                  class="tohfa-input"
                  [class.invalid]="errors()['plotsRecorded']"
                  [placeholder]="S.PLOTS_RECORDED_PLACEHOLDER"
                  [(ngModel)]="form.plotsRecorded"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['plotsRecorded'] as e">{{ e }}</p>
              </div>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="fa-docs-title">
            <h2 class="card-title" id="fa-docs-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">description</span>{{ S.DOCUMENTS }}
            </h2>
            <button type="button" class="add-doc" aria-disabled="true" [title]="S.UPLOAD_NOT_AVAILABLE">
              <span class="material-symbols-outlined icon" aria-hidden="true">upload</span>{{ S.ADD_ANOTHER_DOCUMENT }}
            </button>
          </section>
        </div>

        <!-- ================= Column 3: summary ================= -->
        <aside class="col sticky">
          <section class="tohfa-card" aria-labelledby="fa-summary-title">
            <h2 class="card-title" id="fa-summary-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">assignment</span>{{ S.SUMMARY }}
            </h2>
            <div class="summary-row">
              <div>
                <span class="summary-label">{{ S.FARMER_ID }}</span>
                <span class="summary-hint">{{ S.FARMER_ID_HINT }}</span>
              </div>
              <span class="farmer-id">{{ S.FARMER_ID_PLACEHOLDER }}</span>
            </div>
            <div class="status-row">
              <span class="summary-label">{{ S.APPLICATION_STATUS }}</span>
              <span class="tohfa-badge tohfa-badge-neutral tohfa-badge-sm">{{ S.STATUS_DRAFT }}</span>
            </div>
            <h3 class="checklist-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">checklist</span>{{ S.CHECKLIST }}
            </h3>
            <ul class="checklist">
              <li
                *ngFor="let item of checklist()"
                class="check"
                [class.done]="item.done"
                [class.unavailable]="item.unavailable"
                [title]="item.unavailable ? S.CHECK_UNAVAILABLE : ''"
                [attr.aria-label]="item.label + ', ' + (item.done ? S.CHECK_DONE : S.CHECK_TODO)"
              >
                <span class="dot" aria-hidden="true">
                  <span *ngIf="item.done" class="material-symbols-outlined icon">check</span>
                </span>
                {{ item.label }}
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <div class="form-actions">
        <p class="draft-note">{{ S.DRAFT_ONLY_NOTE }}</p>
        <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="cancel()">{{ S.BTN_CANCEL }}</button>
        <button type="submit" class="tohfa-btn tohfa-btn-primary-l" [disabled]="saving() || saved() || partial()">
          {{ saving() ? S.BTN_SAVING : S.BTN_SAVE }}
        </button>
      </div>
    </form>

    <!-- Shared bits for the picker rows. -->
    <ng-template #addBtn let-tip="tip">
      <button type="button" class="tohfa-btn tohfa-btn-outline-amber add-btn" aria-disabled="true" [title]="tip">
        <span class="material-symbols-outlined icon" aria-hidden="true">add</span>{{ S.BTN_ADD }}
      </button>
    </ng-template>
    <ng-template #chip let-label="label" let-field="field">
      <span class="chips">
        <span class="chip" *ngIf="label">
          {{ label }}
          <button type="button" [attr.aria-label]="S.REMOVE_CHIP(label)" [title]="S.REMOVE_CHIP(label)" (click)="clear(field)">
            <span class="material-symbols-outlined icon" aria-hidden="true">close</span>
          </button>
        </span>
      </span>
    </ng-template>

    <!-- FMB Details & Sketch -->
    <tohfa-farmer-fmb-dialog
      *ngIf="fmbFor() !== null"
      [plots]="plots()"
      [initialPlotId]="fmbFor()"
      [village]="form.village.trim()"
      [zoneName]="selectedZone()?.name ?? ''"
      (closed)="fmbFor.set(null)"
      (edit)="openPlot($event)"
      (remove)="deleteTarget.set($event)"
    ></tohfa-farmer-fmb-dialog>

    <!-- Add / Edit Plot (stacks above the FMB dialog when opened from it) -->
    <tohfa-farmer-plot-dialog
      *ngIf="plotDialog() as d"
      [plot]="d.plot"
      [nextId]="nextId()"
      (saved)="savePlot($event)"
      (closed)="plotDialog.set(null)"
    ></tohfa-farmer-plot-dialog>

    <!-- Delete plot confirmation -->
    <div class="tohfa-dialog-scrim" *ngIf="deleteTarget() as target" (click)="deleteTarget.set(null)">
      <div
        class="tohfa-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fa-delete-title"
        aria-describedby="fa-delete-body"
        tohfaDialogFocus
        (dialogClose)="deleteTarget.set(null)"
        (click)="$event.stopPropagation()"
      >
        <h2 class="dialog-title" id="fa-delete-title">{{ S.DELETE_TITLE }}</h2>
        <p class="dialog-body" id="fa-delete-body">{{ S.deleteBody(target.id, target.label) }}</p>
        <div class="dialog-actions">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" data-autofocus (click)="deleteTarget.set(null)">
            {{ S.DELETE_KEEP }}
          </button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" (click)="deletePlot(target)">{{ S.DELETE_CONFIRM }}</button>
        </div>
      </div>
    </div>

    <!-- Unsaved-changes confirmation for Cancel -->
    <div class="tohfa-dialog-scrim" *ngIf="confirmLeave()" (click)="confirmLeave.set(false)">
      <div
        class="tohfa-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fa-leave-title"
        aria-describedby="fa-leave-body"
        tohfaDialogFocus
        (dialogClose)="confirmLeave.set(false)"
        (click)="$event.stopPropagation()"
      >
        <h2 class="dialog-title" id="fa-leave-title">{{ S.LEAVE_TITLE }}</h2>
        <p class="dialog-body" id="fa-leave-body">{{ S.LEAVE_BODY }}</p>
        <div class="dialog-actions">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" data-autofocus (click)="confirmLeave.set(false)">
            {{ S.LEAVE_STAY }}
          </button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" (click)="discard()">{{ S.LEAVE_DISCARD }}</button>
        </div>
      </div>
    </div>
  `,
})
export class FarmerAddComponent implements OnInit {
  private readonly service = inject(FarmersService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly S = S;
  readonly limits = LIMITS;
  readonly genderChoices = GENDER_CHOICES;
  readonly today = localIsoDate(new Date());

  readonly zones = signal<AdminZoneListItem[]>([]);
  readonly zonesError = signal(false);
  readonly plots = signal<DraftPlot[]>([]);
  /** How many plot ids have been issued; ids are never reused after a delete. */
  private readonly issued = signal(0);

  readonly errors = signal<Partial<Record<FieldKey, string>>>({});
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly partial = signal(false);
  readonly showAadhaar = signal(false);
  readonly confirmLeave = signal(false);

  readonly plotDialog = signal<{ plot: DraftPlot | null } | null>(null);
  /** The plot id the FMB dialog opens on, or null when it is closed. */
  readonly fmbFor = signal<string | null>(null);
  readonly deleteTarget = signal<DraftPlot | null>(null);

  /** Bumped on every edit so OnPush computeds that read the plain `form` object re-evaluate. */
  private readonly revision = signal(0);
  form: FormModel = emptyForm();
  private leaving = false;

  readonly nextId = computed(() => nextPlotId(this.issued()));
  readonly hasGeometry = computed(() => this.plots().some(isPositioned));
  readonly selectedZone = computed(() => {
    this.revision();
    return this.zones().find((z) => z.id === this.form.zoneId) ?? null;
  });

  /** Each item turns checked as its section's required inputs become valid. */
  readonly checklist = computed<ChecklistItem[]>(() => {
    this.revision();
    const all = this.validate();
    const ok = (fields: readonly FieldKey[]): boolean => fields.every((f) => !all[f]);
    const item = (key: SectionKey, label: string, done: boolean, unavailable = false): ChecklistItem => ({
      key,
      label,
      done,
      unavailable,
    });
    return [
      item('personal', S.CHECK_PERSONAL, ok(SECTION_FIELDS.personal)),
      item('identity', S.CHECK_IDENTITY, ok(SECTION_FIELDS.identity)),
      item('upload', S.CHECK_UPLOAD, false, true),
      item('address', S.CHECK_ADDRESS, ok(SECTION_FIELDS.address)),
      item('zone', S.CHECK_ZONE, ok(SECTION_FIELDS.zone)),
      item('farm', S.CHECK_FARM, ok(SECTION_FIELDS.farm)),
      // The application's step-3 gate: at least one location with a boundary or a GPS pin.
      item('fmb', S.CHECK_FMB, this.plots().some(isPositioned)),
      item('docs', S.CHECK_DOCS, false, true),
    ];
  });

  ngOnInit(): void {
    this.service
      .zones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (zones) => {
          this.zones.set(zones);
          this.touched();
        },
        error: () => this.zonesError.set(true),
      });
  }

  acres(value: number): string {
    return formatAcres(value);
  }

  touched(): void {
    this.revision.update((n) => n + 1);
    this.formError.set(null);
  }

  /** Keeps a digits-only field to its length (mobile 10, Aadhaar 12, PIN 6). */
  onDigits(key: 'mobile' | 'aadhaar' | 'pincode', value: string, max: number): void {
    this.form[key] = (value ?? '').replace(/\D/g, '').slice(0, max);
    this.touched();
  }

  /** A chip's ×: clears the single value the picker holds. */
  clear(field: 'gender' | 'zoneId' | 'farmingType' | 'idProofType' | 'district'): void {
    this.form[field] = '';
    this.touched();
  }

  // ---------- Plots ----------

  openPlot(plot: DraftPlot | null): void {
    this.plotDialog.set({ plot });
  }

  openFmb(plot: DraftPlot): void {
    this.fmbFor.set(plot.id);
  }

  savePlot(plot: DraftPlot): void {
    const exists = this.plots().some((p) => p.id === plot.id);
    if (exists) {
      this.plots.update((list) => list.map((p) => (p.id === plot.id ? plot : p)));
    } else {
      this.plots.update((list) => [...list, plot]);
      this.issued.update((n) => n + 1);
    }
    this.plotDialog.set(null);
    this.touched();
  }

  deletePlot(plot: DraftPlot): void {
    this.plots.update((list) => list.filter((p) => p.id !== plot.id));
    this.deleteTarget.set(null);
    if (this.plots().length === 0) this.fmbFor.set(null);
    this.touched();
  }

  // ---------- Save ----------

  save(): void {
    if (this.saving()) return;
    this.formError.set(null);
    const all = this.validate();
    const blocking = Object.fromEntries(
      Object.entries(all).filter(([key]) => SAVED_FIELDS.includes(key as FieldKey)),
    ) as Partial<Record<FieldKey, string>>;
    // Show every problem, but only what the API persists may block the save.
    this.errors.set(all);
    if (Object.keys(blocking).length > 0) {
      this.formError.set(S.SAVE_INVALID);
      return;
    }

    this.saving.set(true);
    this.service
      .create(this.buildCreate())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (farmer) => this.followUp(farmer.id),
        error: (err: unknown) => {
          this.saving.set(false);
          this.applyServerError(err);
        },
      });
  }

  /** dob, gender and address line 2 are not in createAdminFarmer; PATCH them onto the new farmer. */
  private followUp(id: string): void {
    const patch = this.buildFollowUp();
    if (Object.keys(patch).length === 0) {
      this.finish(id, false);
      return;
    }
    this.service
      .update(id, patch)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.finish(id, false),
        error: () => this.finish(id, true),
      });
  }

  private finish(id: string, partial: boolean): void {
    this.saving.set(false);
    this.leaving = true;
    // The farmer exists either way; a failed follow-up goes to the edit screen to finish it.
    (partial ? this.partial : this.saved).set(true);
    const target = partial ? ['/farmers', id, 'edit'] : ['/farmers', id];
    setTimeout(() => void this.router.navigate(target), REDIRECT_MS);
  }

  cancel(): void {
    if (this.isDirty()) {
      this.confirmLeave.set(true);
      return;
    }
    this.leaving = true;
    void this.router.navigate(['/farmers']);
  }

  discard(): void {
    this.confirmLeave.set(false);
    this.leaving = true;
    void this.router.navigate(['/farmers']);
  }

  /** Used by the route's `unsavedChangesGuard` (app.routes.ts) for navigation away other than Cancel. */
  canLeave(): boolean {
    if (this.leaving || !this.isDirty()) return true;
    return window.confirm(S.LEAVE_CONFIRM);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.leaving && this.isDirty()) event.preventDefault();
  }

  private isDirty(): boolean {
    const blank = emptyForm();
    const changed = (Object.keys(blank) as (keyof FormModel)[]).some(
      (k) => String(this.form[k] ?? '').trim() !== String(blank[k] ?? ''),
    );
    return changed || this.plots().length > 0;
  }

  private buildCreate(): AdminFarmerCreateRequest {
    const f = this.form;
    return {
      fullName: f.fullName.trim(),
      mobile: `${INDIA_PREFIX}${f.mobile}`,
      email: orNull(f.email),
      zoneId: f.zoneId,
      village: f.village.trim(),
      taluk: orNull(f.taluk),
      district: f.district.trim(),
      pincode: orNull(f.pincode),
      // BR-33b: only the last four digits are ever sent or stored.
      aadhaarLast4: f.aadhaar.slice(-4),
      addressLine1: orNull(f.addressLine1),
    };
  }

  private buildFollowUp(): AdminFarmerUpdateRequest {
    const f = this.form;
    const patch: AdminFarmerUpdateRequest = {};
    if (f.dob !== '') patch.dob = f.dob;
    if (f.gender !== '') patch.gender = f.gender;
    const line2 = orNull(f.addressLine2);
    if (line2 !== null) patch.addressLine2 = line2;
    return patch;
  }

  /** The application's step rules, tightened to createAdminFarmer where it is stricter. */
  private validate(): Partial<Record<FieldKey, string>> {
    const f = this.form;
    const e: Partial<Record<FieldKey, string>> = {};
    const required = (keys: readonly (keyof FormModel)[]): void => {
      for (const key of keys) if (String(f[key] ?? '').trim() === '') e[key as FieldKey] = S.ERR_REQUIRED;
    };

    const name = f.fullName.trim();
    if (name.length < LIMITS.fullNameMin || name.length > LIMITS.fullNameMax) e.fullName = S.ERR_FULL_NAME;
    if (!MOBILE_LOCAL.test(f.mobile)) e.mobile = S.ERR_MOBILE;
    const email = f.email.trim();
    if (email !== '' && (email.length > LIMITS.emailMax || !EMAIL.test(email))) e.email = S.ERR_EMAIL;
    if (f.dob === '') e.dob = S.ERR_REQUIRED;
    else if (!isRealPastDate(f.dob, this.today)) e.dob = S.ERR_DOB;

    if (!AADHAAR.test(f.aadhaar)) e.aadhaar = S.ERR_AADHAAR;

    required(['gender', 'idProofType', 'village', 'taluk', 'district', 'zoneId', 'farmingType', 'addressLine1', 'farmName']);
    for (const key of ['addressLine1', 'addressLine2'] as const) {
      if (!e[key] && f[key].trim().length > LIMITS.addressMax) e[key] = S.errMax(LIMITS.addressMax);
    }
    for (const key of ['village', 'taluk', 'district', 'farmName'] as const) {
      if (!e[key] && f[key].trim().length > LIMITS.placeMax) e[key] = S.errMax(LIMITS.placeMax);
    }
    if (f.pincode === '') e.pincode = S.ERR_REQUIRED;
    else if (!PINCODE.test(f.pincode)) e.pincode = S.ERR_PINCODE;

    const area = Number(f.totalArea);
    if (f.totalArea === null || f.totalArea === '' || !Number.isFinite(area) || area <= 0 || area >= LIMITS.maxAcres) {
      e.totalArea = S.ERR_AREA;
    }
    const count = Number(f.plotsRecorded);
    if (f.plotsRecorded === null || f.plotsRecorded === '' || !Number.isInteger(count) || count < 1) {
      e.plotsRecorded = S.ERR_COUNT;
    }
    return e;
  }

  /** problem+json → field errors (422 `errors` keyed `body.<field>`) or a banner. */
  private applyServerError(err: unknown): void {
    const problem = err instanceof ApiError ? err.problem : null;
    const status = statusOf(err);
    if (problem?.code === 'CONFLICT' || status === 409) {
      this.errors.set({ mobile: S.MOBILE_TAKEN });
      this.formError.set(S.SAVE_INVALID);
      return;
    }
    if (status === 403) {
      this.formError.set(S.SAVE_FORBIDDEN);
      return;
    }
    if (status === 422 && problem?.errors) {
      const fieldErrors: Partial<Record<FieldKey, string>> = {};
      for (const [path, messages] of Object.entries(problem.errors)) {
        const key = FIELD_FROM_API[path.replace(/^body\./, '')];
        if (key && messages[0]) fieldErrors[key] = messages[0];
      }
      this.errors.set(fieldErrors);
      this.formError.set(Object.keys(fieldErrors).length > 0 ? S.SAVE_INVALID : (problem.detail ?? S.SAVE_ERROR));
      return;
    }
    this.formError.set(problem?.detail ?? S.SAVE_ERROR);
  }
}

function emptyForm(): FormModel {
  return {
    fullName: '',
    mobile: '',
    email: '',
    dob: '',
    gender: '',
    idProofType: '',
    aadhaar: '',
    addressLine1: '',
    addressLine2: '',
    village: '',
    taluk: '',
    pincode: '',
    district: DEFAULT_DISTRICT,
    zoneId: '',
    farmingType: DEFAULT_FARMING_TYPE,
    farmName: '',
    totalArea: null,
    plotsRecorded: null,
  };
}

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function statusOf(err: unknown): number | undefined {
  if (err instanceof ApiError) return err.problem.status;
  return (err as { status?: number } | null)?.status;
}

function localIsoDate(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** A real `YYYY-MM-DD` calendar date not after today (the application's step-1 dob rule). */
function isRealPastDate(iso: string, today: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return real && iso <= today;
}
