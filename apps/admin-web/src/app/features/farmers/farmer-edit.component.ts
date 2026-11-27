/**
 * Farmers Management → Edit Farmer Profile (SA-M3-S02a).
 *
 * The inputs are the farmer application's field set (mobile registration step 1 "personal" and
 * step 2 "farm details"), but only what docs/openapi.yaml `updateAdminFarmer`
 * (PATCH /v1/admin/farmers/{id}, `farmer.profile.edit`) accepts is editable:
 * fullName, email, dob, gender, farmingExperienceYears, addressLine1, village, taluk, district,
 * pincode, and — for a holder of `farmer.profile.edit_locked_field` (SUPER_ADMIN) — mobile (BR-33).
 * Only changed values are sent. The API writes the `farmer.profile.edit` audit row in the same
 * transaction as the update.
 *
 * Rendered from the design but disabled, because no admin endpoint saves them (spec gaps, never
 * invented fields): Farming Method, Primary Crops and Language (application step 2 / step 1, not
 * returned or editable by the profile API); Alternate Mobile, Farmer Type, Preferred
 * Communication, State and PAN (in no schema at all); Zone (the PATCH has no zoneId); the photo
 * upload / remove; Aadhaar (locked, last four digits only, BR-33b); and the farm-location map
 * actions (a land location is edited only by its farmer, PATCH /farms/{farmId}).
 *
 * Required markers follow the application's step-1 rules. A required field that was already
 * empty on the profile does not block saving other fields; it only cannot be cleared.
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../core/auth.interceptor';
import { RbacService } from '../../core/rbac.service';
import { FARMER_EDIT_STRINGS as S } from './farmer-edit.strings';
import {
  FarmersService,
  type AdminFarmerDetail,
  type AdminFarmerKycStatus,
  type AdminFarmerUpdateRequest,
} from './farmers.service';

type Gender = NonNullable<AdminFarmerDetail['gender']>;

/** The form's own keys. API field names map onto them in FIELD_FROM_API. */
type FieldKey =
  | 'fullName'
  | 'mobile'
  | 'email'
  | 'gender'
  | 'dob'
  | 'experience'
  | 'village'
  | 'taluk'
  | 'district'
  | 'addressLine1'
  | 'pincode';

interface FormModel {
  fullName: string;
  /** Ten local digits; sent as E.164 `+91…`. */
  mobile: string;
  email: string;
  gender: Gender | '';
  /** `YYYY-MM-DD`. */
  dob: string;
  experience: string;
  village: string;
  taluk: string;
  district: string;
  addressLine1: string;
  pincode: string;
}

/** Limits from docs/openapi.yaml `AdminFarmerUpdateRequest` (apps/api admin-farmers.schema.ts). */
const LIMITS = {
  fullNameMin: 2,
  fullNameMax: 120,
  emailMax: 254,
  experienceMax: 120,
  addressMax: 200,
  placeMax: 120,
} as const;

const MOBILE_LOCAL = /^[6-9]\d{9}$/;
const PINCODE = /^[1-9][0-9]{5}$/;
/** Deliberately loose: the API's Zod `.email()` is the authority; this only catches typos early. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIA_PREFIX = '+91';
/** How long the success banner shows before returning to the farmer's details. */
const SUCCESS_REDIRECT_MS = 900;

/** The application's gender picker offers Male / Female / Other; UNDISCLOSED is shown only when stored. */
const GENDER_CHOICES: readonly Gender[] = ['MALE', 'FEMALE', 'OTHER'];

const FIELD_FROM_API: Readonly<Record<string, FieldKey>> = {
  fullName: 'fullName',
  mobile: 'mobile',
  email: 'email',
  gender: 'gender',
  dob: 'dob',
  farmingExperienceYears: 'experience',
  village: 'village',
  taluk: 'taluk',
  district: 'district',
  addressLine1: 'addressLine1',
  pincode: 'pincode',
};

const KYC_TONE: Record<AdminFarmerKycStatus, 'success' | 'warning' | 'danger'> = {
  VERIFIED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
};

@Component({
  selector: 'tohfa-farmer-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
      .page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-18);
      }
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
      .actions {
        display: flex;
        gap: var(--space-10);
      }
      .actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }

      /* ---------- Layout ---------- */
      .layout {
        display: grid;
        grid-template-columns: var(--layout-profile-row);
        gap: var(--space-18);
        align-items: start;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: var(--space-18);
        min-width: 0;
      }
      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-8);
        margin: 0 0 var(--space-18);
        font-size: var(--fs-card);
        font-weight: var(--fw-bold);
      }
      .card-title .icon {
        font-size: var(--icon-nav);
        color: var(--tohfa-slate);
      }
      .card-title .icon.amber {
        color: var(--tohfa-amber);
      }
      .card-title .icon.ok {
        color: var(--ok);
      }

      /* ---------- Fields ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: var(--space-14) var(--space-18);
      }
      .span-3 {
        grid-column: span 3;
      }
      .span-4 {
        grid-column: span 4;
      }
      .span-6 {
        grid-column: span 6;
      }
      .span-12 {
        grid-column: span 12;
      }
      .field {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .field .tohfa-label {
        font-size: var(--fs-dense);
      }
      .control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .tohfa-input {
        border-radius: var(--r-sm);
        min-height: var(--tohfa-min-touch-target);
        font-size: var(--fs-body);
      }
      .tohfa-input.invalid {
        border-color: var(--err);
      }
      .tohfa-input[readonly] {
        background: var(--tohfa-disabled-bg);
        color: var(--tohfa-slate);
      }
      .tohfa-input[readonly]:focus {
        border-color: var(--tohfa-border);
        box-shadow: none;
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
        background: none;
        display: inline-flex;
      }
      select.tohfa-input {
        appearance: none;
        cursor: pointer;
      }
      select.tohfa-input:disabled {
        cursor: not-allowed;
      }
      /* Native date control: its own picker indicator is laid invisibly over the calendar icon,
         so clicking the icon still opens the browser picker. */
      input[type='date']::-webkit-calendar-picker-indicator {
        position: absolute;
        right: var(--space-10);
        opacity: 0;
        cursor: pointer;
      }
      textarea.tohfa-input {
        resize: vertical;
      }
      .counter {
        align-self: flex-end;
        margin-top: var(--space-4);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .field-error {
        margin: var(--space-4) 0 0;
        font-size: var(--fs-cap);
        color: var(--err);
      }

      /* ---------- Farmer Photo ---------- */
      .photo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-6);
      }
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: calc(var(--space-20) * 4);
        height: calc(var(--space-20) * 4);
        margin-bottom: var(--space-10);
        border-radius: var(--r-circle);
        background: var(--tohfa-amber-tint);
        color: var(--tohfa-brown);
        font-size: var(--fs-kpi);
        font-weight: var(--fw-bold);
        object-fit: cover;
      }
      .photo-title {
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }
      .photo-hint {
        margin-bottom: var(--space-10);
        font-size: var(--fs-cap);
        color: var(--tohfa-muted);
      }
      .photo .tohfa-btn-outline-amber {
        width: 100%;
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
      }
      .link-danger {
        display: inline-flex;
        align-items: center;
        gap: var(--space-4);
        min-height: var(--tohfa-min-touch-target);
        padding: 0 var(--space-12);
        border: none;
        background: none;
        color: var(--err);
        font-family: var(--font);
        font-size: var(--fs-cell);
        font-weight: var(--fw-bold);
      }

      /* ---------- Identity ---------- */
      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--space-14);
      }
      .stack .tohfa-label {
        font-weight: var(--fw-regular);
        color: var(--tohfa-slate);
      }
      .stack .tohfa-input[readonly] {
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
      }
      .kyc-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }

      /* ---------- Farm Location ---------- */
      .map {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        min-height: calc(var(--space-24) * 5);
        border: 1px dashed var(--tohfa-strong-border);
        border-radius: var(--r-sm);
        background: var(--ok-bg);
        color: var(--tohfa-ink);
        text-align: center;
      }
      .map-icon {
        font-size: var(--icon-dialog-hero);
        color: var(--tohfa-amber);
      }
      .map-title {
        font-size: var(--fs-body);
        font-weight: var(--fw-semi);
      }
      .map-sub {
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .map-sub u {
        cursor: not-allowed;
      }
      .zoom {
        position: absolute;
        top: var(--space-8);
        right: var(--space-8);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      .zoom button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--space-24);
        height: var(--space-24);
        padding: 0;
        border: 1px solid var(--tohfa-border);
        border-radius: var(--r-checkbox);
        background: var(--tohfa-surface);
        color: var(--tohfa-ink);
      }
      .zoom .icon {
        font-size: var(--icon-row-action);
      }
      .coords {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        margin: var(--space-12) 0;
        font-size: var(--fs-cap);
        color: var(--tohfa-slate);
      }
      .coords .icon {
        font-size: var(--icon-row-action);
        color: var(--tohfa-muted);
      }
      .loc-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-10);
      }
      .loc-actions .tohfa-btn {
        min-height: var(--tohfa-min-touch-target);
        border-radius: var(--tohfa-radius-button);
        font-size: var(--fs-cap);
      }
      .loc-actions .tohfa-btn-secondary {
        color: var(--tohfa-ink);
      }

      .banner-row {
        margin: 0;
      }

      /* ---------- Dialog ---------- */
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
    <p class="tohfa-banner tohfa-banner-info banner-row" *ngIf="state() === 'loading'" role="status">{{ S.LOADING }}</p>

    <ng-container *ngIf="state() === 'missing' || state() === 'error'">
      <p class="tohfa-banner tohfa-banner-danger banner-row" role="alert">
        {{ state() === 'missing' ? S.NOT_FOUND : S.LOAD_ERROR }}
      </p>
      <div class="actions">
        <button *ngIf="state() === 'error'" type="button" class="tohfa-btn tohfa-btn-secondary" (click)="load()">
          {{ S.RETRY }}
        </button>
        <a class="tohfa-btn tohfa-btn-secondary" routerLink="/farmers">{{ S.BACK_TO_DIRECTORY }}</a>
      </div>
    </ng-container>

    <form *ngIf="farmer() as f" class="col" novalidate (ngSubmit)="save()">
      <header class="page-head">
        <div>
          <h1 class="page-title">{{ S.TITLE }}</h1>
          <p class="page-subtitle">{{ S.SUBTITLE }}</p>
        </div>
        <div class="actions">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="cancel()">{{ S.BTN_CANCEL }}</button>
          <button type="submit" class="tohfa-btn tohfa-btn-primary-l" [disabled]="saving() || !isDirty()">
            {{ saving() ? S.BTN_SAVING : S.BTN_SAVE }}
          </button>
        </div>
      </header>

      <p class="tohfa-banner tohfa-banner-success banner-row" *ngIf="saved()" role="status">{{ S.SAVE_SUCCESS }}</p>
      <p class="tohfa-banner tohfa-banner-danger banner-row" *ngIf="formError() as msg" role="alert">{{ msg }}</p>

      <div class="layout">
        <!-- ================= Left column ================= -->
        <div class="col">
          <section class="tohfa-card" aria-labelledby="personal-title">
            <h2 class="card-title" id="personal-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">person</span>{{ S.PERSONAL_DETAILS }}
            </h2>
            <div class="grid">
              <div class="field span-6">
                <label class="tohfa-label tohfa-label-required" for="fe-fullName">{{ S.FULL_NAME }}</label>
                <input
                  id="fe-fullName"
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
              <div class="field span-6">
                <label class="tohfa-label" for="fe-farmerId">{{ S.FARMER_ID }}</label>
                <div class="control" [title]="S.FARMER_ID_LOCKED">
                  <input id="fe-farmerId" class="tohfa-input with-trail" [value]="f.tohfaFarmerId" readonly />
                  <span class="material-symbols-outlined trail" aria-hidden="true">lock</span>
                </div>
              </div>

              <div class="field span-6">
                <label class="tohfa-label tohfa-label-required" for="fe-mobile">{{ S.MOBILE }}</label>
                <div class="control" [title]="canEditLocked() ? '' : S.MOBILE_LOCKED">
                  <input
                    id="fe-mobile"
                    name="mobile"
                    class="tohfa-input"
                    [class.with-trail]="!canEditLocked()"
                    [class.invalid]="errors()['mobile']"
                    inputmode="numeric"
                    maxlength="10"
                    [placeholder]="S.MOBILE_PLACEHOLDER"
                    [readonly]="!canEditLocked()"
                    [(ngModel)]="form.mobile"
                    (ngModelChange)="onMobile($event)"
                  />
                  <span *ngIf="!canEditLocked()" class="material-symbols-outlined trail" aria-hidden="true">lock</span>
                </div>
                <p class="field-error" *ngIf="errors()['mobile'] as e">{{ e }}</p>
              </div>
              <div class="field span-6">
                <label class="tohfa-label" for="fe-altMobile">{{ S.ALTERNATE_MOBILE }}</label>
                <input
                  id="fe-altMobile"
                  class="tohfa-input"
                  [placeholder]="S.ALTERNATE_MOBILE_PLACEHOLDER"
                  disabled
                  [title]="S.NOT_AVAILABLE_YET"
                />
              </div>

              <div class="field span-6">
                <label class="tohfa-label" for="fe-email">{{ S.EMAIL }}</label>
                <input
                  id="fe-email"
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
              <div class="field span-3">
                <label class="tohfa-label tohfa-label-required" for="fe-gender">{{ S.GENDER }}</label>
                <div class="control">
                  <select
                    id="fe-gender"
                    name="gender"
                    class="tohfa-input with-trail"
                    [class.invalid]="errors()['gender']"
                    [(ngModel)]="form.gender"
                    (ngModelChange)="touched()"
                  >
                    <option value="" disabled>{{ S.GENDER_PLACEHOLDER }}</option>
                    <option *ngFor="let g of genderChoices()" [value]="g">{{ S.GENDER_OPTIONS[g] }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
                <p class="field-error" *ngIf="errors()['gender'] as e">{{ e }}</p>
              </div>
              <div class="field span-3">
                <label class="tohfa-label" for="fe-dob">{{ S.DOB }}</label>
                <div class="control">
                  <input
                    id="fe-dob"
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

              <div class="field span-4">
                <label class="tohfa-label tohfa-label-required" for="fe-method">{{ S.FARMING_METHOD }}</label>
                <div class="control" [title]="S.NOT_IN_PROFILE_API">
                  <select id="fe-method" class="tohfa-input with-trail" disabled>
                    <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let m of S.FARMING_METHOD_OPTIONS" [value]="m">{{ m }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div class="field span-4">
                <label class="tohfa-label" for="fe-experience">{{ S.EXPERIENCE }}</label>
                <input
                  id="fe-experience"
                  name="experience"
                  class="tohfa-input"
                  [class.invalid]="errors()['experience']"
                  inputmode="numeric"
                  maxlength="3"
                  [placeholder]="S.EXPERIENCE_PLACEHOLDER"
                  [(ngModel)]="form.experience"
                  (ngModelChange)="touched()"
                />
                <p class="field-error" *ngIf="errors()['experience'] as e">{{ e }}</p>
              </div>
              <div class="field span-4">
                <label class="tohfa-label" for="fe-crops">{{ S.PRIMARY_CROPS }}</label>
                <div class="control" [title]="S.NOT_IN_PROFILE_API">
                  <select id="fe-crops" class="tohfa-input with-trail" disabled>
                    <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>

              <div class="field span-4">
                <label class="tohfa-label" for="fe-type">{{ S.FARMER_TYPE }}</label>
                <div class="control" [title]="S.NOT_AVAILABLE_YET">
                  <select id="fe-type" class="tohfa-input with-trail" disabled>
                    <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div class="field span-4">
                <label class="tohfa-label" for="fe-language">{{ S.LANGUAGE }}</label>
                <div class="control" [title]="S.NOT_IN_PROFILE_API">
                  <select id="fe-language" class="tohfa-input with-trail" disabled>
                    <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                    <option *ngFor="let l of S.LANGUAGE_OPTIONS" [value]="l">{{ l }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div class="field span-4">
                <label class="tohfa-label" for="fe-comm">{{ S.COMMUNICATION }}</label>
                <div class="control" [title]="S.NOT_AVAILABLE_YET">
                  <select id="fe-comm" class="tohfa-input with-trail" disabled>
                    <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="address-title">
            <h2 class="card-title" id="address-title">
              <span class="material-symbols-outlined icon amber" aria-hidden="true">location_on</span>{{ S.ADDRESS_DETAILS }}
            </h2>
            <div class="grid">
              <div class="field span-3">
                <label class="tohfa-label tohfa-label-required" for="fe-village">{{ S.VILLAGE }}</label>
                <input
                  id="fe-village"
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
              <div class="field span-3">
                <label class="tohfa-label tohfa-label-required" for="fe-zone">{{ S.ZONE }}</label>
                <div class="control" [title]="S.ZONE_LOCKED">
                  <select id="fe-zone" class="tohfa-input with-trail" disabled>
                    <option>{{ f.zone?.name ?? S.ZONE_NONE }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div class="field span-3">
                <label class="tohfa-label tohfa-label-required" for="fe-district">{{ S.DISTRICT }}</label>
                <div class="control">
                  <select
                    id="fe-district"
                    name="district"
                    class="tohfa-input with-trail"
                    [class.invalid]="errors()['district']"
                    [(ngModel)]="form.district"
                    (ngModelChange)="touched()"
                  >
                    <option *ngFor="let d of districtChoices()" [value]="d">{{ d }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
                <p class="field-error" *ngIf="errors()['district'] as e">{{ e }}</p>
              </div>
              <div class="field span-3">
                <label class="tohfa-label tohfa-label-required" for="fe-state">{{ S.STATE }}</label>
                <div class="control" [title]="S.NOT_IN_PROFILE_API">
                  <select id="fe-state" class="tohfa-input with-trail" disabled>
                    <option value="">{{ S.SELECT_PLACEHOLDER }}</option>
                  </select>
                  <span class="material-symbols-outlined trail" aria-hidden="true">expand_more</span>
                </div>
              </div>

              <div class="field span-12">
                <label class="tohfa-label tohfa-label-required" for="fe-address">{{ S.ADDRESS }}</label>
                <textarea
                  id="fe-address"
                  name="addressLine1"
                  class="tohfa-input"
                  [class.invalid]="errors()['addressLine1']"
                  rows="3"
                  [maxLength]="limits.addressMax"
                  [placeholder]="S.ADDRESS_PLACEHOLDER"
                  [(ngModel)]="form.addressLine1"
                  (ngModelChange)="touched()"
                ></textarea>
                <span class="counter">{{ S.counter(form.addressLine1.length, limits.addressMax) }}</span>
                <p class="field-error" *ngIf="errors()['addressLine1'] as e">{{ e }}</p>
              </div>

              <div class="field span-3">
                <label class="tohfa-label tohfa-label-required" for="fe-pincode">{{ S.PINCODE }}</label>
                <input
                  id="fe-pincode"
                  name="pincode"
                  class="tohfa-input"
                  [class.invalid]="errors()['pincode']"
                  inputmode="numeric"
                  maxlength="6"
                  [placeholder]="S.PINCODE_PLACEHOLDER"
                  [(ngModel)]="form.pincode"
                  (ngModelChange)="onPincode($event)"
                />
                <p class="field-error" *ngIf="errors()['pincode'] as e">{{ e }}</p>
              </div>
              <div class="field span-3">
                <label class="tohfa-label tohfa-label-required" for="fe-taluk">{{ S.TALUK }}</label>
                <input
                  id="fe-taluk"
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
            </div>
          </section>
        </div>

        <!-- ================= Right column ================= -->
        <div class="col">
          <section class="tohfa-card" aria-labelledby="photo-title">
            <h2 class="card-title" id="photo-title">
              <span class="material-symbols-outlined icon" aria-hidden="true">photo_camera</span>{{ S.FARMER_PHOTO }}
            </h2>
            <div class="photo">
              <img *ngIf="photoUrl() as url; else initialsAvatar" class="avatar" [src]="url" [alt]="S.PHOTO_ALT" />
              <ng-template #initialsAvatar>
                <span class="avatar" aria-hidden="true">{{ initials() }}</span>
              </ng-template>
              <span class="photo-title">{{ S.UPLOAD_PHOTO }}</span>
              <span class="photo-hint">{{ S.PHOTO_HINT }}</span>
              <button
                type="button"
                class="tohfa-btn tohfa-btn-outline-amber"
                aria-disabled="true"
                [title]="S.PHOTO_NOT_AVAILABLE"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">upload</span>{{ S.CHOOSE_FILE }}
              </button>
              <button type="button" class="link-danger" aria-disabled="true" [title]="S.PHOTO_NOT_AVAILABLE">
                <span class="material-symbols-outlined icon" aria-hidden="true">delete</span>{{ S.REMOVE }}
              </button>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="identity-title">
            <h2 class="card-title" id="identity-title">
              <span class="material-symbols-outlined icon ok" aria-hidden="true">verified_user</span>{{ S.IDENTITY }}
            </h2>
            <div class="stack">
              <div class="field">
                <label class="tohfa-label" for="fe-aadhaar">{{ S.AADHAAR }}</label>
                <div class="control">
                  <!-- Masked only: the API returns the last four digits and never more (BR-33b). -->
                  <input
                    id="fe-aadhaar"
                    class="tohfa-input with-trail"
                    [value]="f.aadhaarLast4 ? S.aadhaarMasked(f.aadhaarLast4) : S.AADHAAR_NONE"
                    readonly
                  />
                  <button
                    type="button"
                    class="material-symbols-outlined trail"
                    aria-disabled="true"
                    [title]="S.AADHAAR_REVEAL"
                    [attr.aria-label]="S.AADHAAR_REVEAL"
                  >
                    visibility
                  </button>
                </div>
              </div>
              <div class="field">
                <label class="tohfa-label" for="fe-pan">{{ S.PAN }}</label>
                <input
                  id="fe-pan"
                  class="tohfa-input"
                  [placeholder]="S.PAN_PLACEHOLDER"
                  disabled
                  [title]="S.NOT_AVAILABLE_YET"
                />
              </div>
              <div class="kyc-row">
                {{ S.KYC_STATUS }}
                <span class="tohfa-badge tohfa-badge-{{ kycTone() }}">{{ S.KYC_OPTIONS[f.kycStatus] }}</span>
              </div>
            </div>
          </section>

          <section class="tohfa-card" aria-labelledby="location-title">
            <h2 class="card-title" id="location-title">
              <span class="material-symbols-outlined icon amber" aria-hidden="true">location_on</span>{{ S.FARM_LOCATION }}
            </h2>
            <div class="map" [title]="S.LOCATION_NOT_AVAILABLE">
              <div class="zoom">
                <button type="button" aria-disabled="true" [title]="S.ZOOM_IN" [attr.aria-label]="S.ZOOM_IN">
                  <span class="material-symbols-outlined icon" aria-hidden="true">add</span>
                </button>
                <button type="button" aria-disabled="true" [title]="S.ZOOM_OUT" [attr.aria-label]="S.ZOOM_OUT">
                  <span class="material-symbols-outlined icon" aria-hidden="true">remove</span>
                </button>
              </div>
              <span class="material-symbols-outlined map-icon" aria-hidden="true">add_location_alt</span>
              <span class="map-title">{{ S.MAP_TITLE }}</span>
              <span class="map-sub">{{ S.MAP_OR }}<u aria-disabled="true">{{ S.MAP_BROWSE }}</u></span>
            </div>
            <p class="coords">
              <span class="material-symbols-outlined icon" aria-hidden="true">my_location</span>
              <ng-container *ngIf="centroid() as c; else noCoords">{{ S.COORDINATES }}{{ S.latLng(c.lat, c.lng) }}</ng-container>
              <ng-template #noCoords>{{ S.NO_COORDINATES }}</ng-template>
            </p>
            <div class="loc-actions">
              <button
                type="button"
                class="tohfa-btn tohfa-btn-outline-amber"
                aria-disabled="true"
                [title]="S.LOCATION_NOT_AVAILABLE"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">location_on</span>{{ S.UPDATE_LOCATION }}
              </button>
              <button
                type="button"
                class="tohfa-btn tohfa-btn-secondary"
                aria-disabled="true"
                [title]="S.LOCATION_NOT_AVAILABLE"
              >
                <span class="material-symbols-outlined icon" aria-hidden="true">edit</span>{{ S.EDIT_ON_MAP }}
              </button>
            </div>
          </section>
        </div>
      </div>
    </form>

    <!-- Unsaved-changes confirmation for Cancel. -->
    <div class="tohfa-dialog-scrim" *ngIf="confirmLeave()" (click)="confirmLeave.set(false)">
      <div
        class="tohfa-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-dialog-title"
        (click)="$event.stopPropagation()"
      >
        <h2 class="dialog-title" id="leave-dialog-title">{{ S.LEAVE_TITLE }}</h2>
        <p class="dialog-body">{{ S.LEAVE_BODY }}</p>
        <div class="dialog-actions">
          <button type="button" class="tohfa-btn tohfa-btn-cancel" (click)="confirmLeave.set(false)">
            {{ S.LEAVE_STAY }}
          </button>
          <button type="button" class="tohfa-btn tohfa-btn-danger-l" (click)="discard()">{{ S.LEAVE_DISCARD }}</button>
        </div>
      </div>
    </div>
  `,
})
export class FarmerEditComponent implements OnInit {
  private readonly service = inject(FarmersService);
  private readonly rbac = inject(RbacService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly S = S;
  readonly limits = LIMITS;
  readonly today = localIsoDate(new Date());

  /** BR-33: only a holder of this code may change the mobile; the API refuses anyone else with FIELD_LOCKED. */
  readonly canEditLocked = computed(() => this.rbac.can('farmer.profile.edit_locked_field'));
  readonly canViewDocuments = computed(() => this.rbac.can('farmer.document.view'));

  readonly state = signal<'loading' | 'ready' | 'missing' | 'error'>('loading');
  readonly farmer = signal<AdminFarmerDetail | null>(null);
  readonly photoUrl = signal<string | null>(null);
  readonly errors = signal<Partial<Record<FieldKey, string>>>({});
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly confirmLeave = signal(false);
  /** Bumped on every edit so OnPush computeds that read the plain `form` object re-evaluate. */
  private readonly revision = signal(0);

  form: FormModel = emptyForm();
  private original: FormModel = emptyForm();
  private farmerId = '';
  /** Set once the user chose to leave (discard or saved) so the leave guard does not ask again. */
  private leaving = false;

  readonly initials = computed(() =>
    (this.farmer()?.fullName ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join(''),
  );
  readonly kycTone = computed(() => KYC_TONE[this.farmer()?.kycStatus ?? 'PENDING']);
  readonly centroid = computed(() => {
    const locations = this.farmer()?.landLocations ?? [];
    const primary = locations.find((l) => l.isPrimary) ?? locations[0];
    return primary?.centroid ?? null;
  });
  readonly genderChoices = computed<readonly Gender[]>(() =>
    this.farmer()?.gender === 'UNDISCLOSED' ? [...GENDER_CHOICES, 'UNDISCLOSED'] : GENDER_CHOICES,
  );
  /** The application's district list, plus the stored value when it is not one of them. */
  readonly districtChoices = computed<readonly string[]>(() => {
    const current = this.farmer()?.address.district ?? '';
    const options: readonly string[] = S.DISTRICT_OPTIONS;
    return current && !options.includes(current) ? [current, ...options] : options;
  });

  ngOnInit(): void {
    this.farmerId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.service
      .get(this.farmerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (farmer) => {
          this.farmer.set(farmer);
          this.original = formFrom(farmer);
          this.form = { ...this.original };
          this.state.set('ready');
          this.loadPhoto();
        },
        error: (err: unknown) => this.state.set(statusOf(err) === 404 ? 'missing' : 'error'),
      });
  }

  /** The newest PHOTO document's signed read URL, if the caller may read documents. */
  private loadPhoto(): void {
    if (!this.canViewDocuments()) return;
    this.service
      .documents(this.farmerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          const photo = items
            .filter((d) => d.docType === 'PHOTO' && d.readUrl !== null)
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
          this.photoUrl.set(photo?.readUrl ?? null);
        },
        // The photo is decorative here; the initials avatar stands in.
        error: () => this.photoUrl.set(null),
      });
  }

  touched(): void {
    this.revision.update((n) => n + 1);
    this.saved.set(false);
  }

  onMobile(value: string): void {
    this.form.mobile = value.replace(/\D/g, '').slice(0, 10);
    this.touched();
  }

  onPincode(value: string): void {
    this.form.pincode = value.replace(/\D/g, '').slice(0, 6);
    this.touched();
  }

  isDirty(): boolean {
    this.revision();
    return Object.keys(this.buildPatch()).length > 0;
  }

  save(): void {
    if (this.saving()) return;
    this.formError.set(null);
    const errors = this.validate();
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) {
      this.formError.set(S.SAVE_INVALID);
      return;
    }
    const patch = this.buildPatch();
    if (Object.keys(patch).length === 0) return;

    this.saving.set(true);
    this.service
      .update(this.farmerId, patch)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (farmer) => {
          this.saving.set(false);
          this.farmer.set(farmer);
          this.original = formFrom(farmer);
          this.form = { ...this.original };
          this.touched();
          this.saved.set(true);
          this.leaving = true;
          setTimeout(() => void this.router.navigate(['/farmers', this.farmerId]), SUCCESS_REDIRECT_MS);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.applyServerError(err);
        },
      });
  }

  cancel(): void {
    if (this.isDirty()) {
      this.confirmLeave.set(true);
      return;
    }
    this.leaving = true;
    void this.router.navigate(['/farmers', this.farmerId]);
  }

  discard(): void {
    this.confirmLeave.set(false);
    this.leaving = true;
    void this.router.navigate(['/farmers', this.farmerId]);
  }

  /** Used by the route's `unsavedChangesGuard` (app.routes.ts) for navigation away other than Cancel. */
  canLeave(): boolean {
    if (this.leaving || this.state() !== 'ready' || !this.isDirty()) return true;
    return window.confirm(S.LEAVE_CONFIRM);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.leaving && this.state() === 'ready' && this.isDirty()) event.preventDefault();
  }

  /**
   * Only changed values, in the API's field names. Mobile is included only for a caller allowed to
   * change it, so an unprivileged save can never trip FIELD_LOCKED.
   */
  private buildPatch(): AdminFarmerUpdateRequest {
    const f = this.form;
    const o = this.original;
    const patch: AdminFarmerUpdateRequest = {};
    if (f.fullName.trim() !== o.fullName) patch.fullName = f.fullName.trim();
    if (f.email.trim() !== o.email) patch.email = orNull(f.email);
    if (f.dob !== o.dob) patch.dob = orNull(f.dob);
    if (f.gender !== o.gender) patch.gender = f.gender === '' ? null : f.gender;
    if (f.experience.trim() !== o.experience) {
      patch.farmingExperienceYears = f.experience.trim() === '' ? null : Number(f.experience.trim());
    }
    if (f.addressLine1.trim() !== o.addressLine1) patch.addressLine1 = orNull(f.addressLine1);
    if (f.village.trim() !== o.village) patch.village = orNull(f.village);
    if (f.taluk.trim() !== o.taluk) patch.taluk = orNull(f.taluk);
    if (f.district.trim() !== o.district) patch.district = f.district.trim();
    if (f.pincode !== o.pincode) patch.pincode = orNull(f.pincode);
    if (this.canEditLocked() && f.mobile !== o.mobile) patch.mobile = `${INDIA_PREFIX}${f.mobile}`;
    return patch;
  }

  /** Mirrors `AdminFarmerUpdateRequest` and the application's step-1 required fields. */
  private validate(): Partial<Record<FieldKey, string>> {
    const f = this.form;
    const o = this.original;
    const e: Partial<Record<FieldKey, string>> = {};
    /** Required = may not be cleared; a value that was already missing does not block other edits. */
    const cleared = (key: keyof FormModel): boolean => f[key].trim() === '' && o[key] !== '';

    const name = f.fullName.trim();
    if (name.length < LIMITS.fullNameMin || name.length > LIMITS.fullNameMax) e.fullName = S.ERR_FULL_NAME;

    if (this.canEditLocked() && f.mobile !== o.mobile && !MOBILE_LOCAL.test(f.mobile)) e.mobile = S.ERR_MOBILE;

    const email = f.email.trim();
    if (email !== '' && (email.length > LIMITS.emailMax || !EMAIL.test(email))) e.email = S.ERR_EMAIL;

    if (cleared('gender')) e.gender = S.ERR_REQUIRED;

    if (f.dob !== '' && !isRealPastDate(f.dob, this.today)) e.dob = S.ERR_DOB;

    const exp = f.experience.trim();
    if (exp !== '' && (!/^\d+$/.test(exp) || Number(exp) > LIMITS.experienceMax)) e.experience = S.ERR_EXPERIENCE;

    for (const key of ['village', 'taluk'] as const) {
      if (cleared(key)) e[key] = S.ERR_REQUIRED;
      else if (f[key].trim().length > LIMITS.placeMax) e[key] = S.errMax(LIMITS.placeMax);
    }
    if (f.district.trim() === '') e.district = S.ERR_REQUIRED;

    if (cleared('addressLine1')) e.addressLine1 = S.ERR_REQUIRED;
    else if (f.addressLine1.trim().length > LIMITS.addressMax) e.addressLine1 = S.errMax(LIMITS.addressMax);

    if (cleared('pincode')) e.pincode = S.ERR_REQUIRED;
    else if (f.pincode !== '' && !PINCODE.test(f.pincode)) e.pincode = S.ERR_PINCODE;

    return e;
  }

  /** problem+json → field errors (422 `errors` keyed `body.<field>`) or a banner. */
  private applyServerError(err: unknown): void {
    const problem = err instanceof ApiError ? err.problem : null;
    const status = statusOf(err);
    if (problem?.code === 'FIELD_LOCKED') {
      this.formError.set(S.SAVE_FIELD_LOCKED);
      return;
    }
    if (problem?.code === 'CONFLICT' || status === 409) {
      this.errors.set({ mobile: S.MOBILE_TAKEN });
      this.formError.set(S.SAVE_INVALID);
      return;
    }
    if (status === 404) {
      this.formError.set(S.SAVE_NOT_FOUND);
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
    gender: '',
    dob: '',
    experience: '',
    village: '',
    taluk: '',
    district: '',
    addressLine1: '',
    pincode: '',
  };
}

function formFrom(f: AdminFarmerDetail): FormModel {
  return {
    fullName: f.fullName,
    mobile: f.mobile.startsWith(INDIA_PREFIX) ? f.mobile.slice(INDIA_PREFIX.length) : f.mobile,
    email: f.email ?? '',
    gender: f.gender ?? '',
    dob: f.dob ? f.dob.slice(0, 10) : '',
    experience: f.farmingExperienceYears === null ? '' : String(f.farmingExperienceYears),
    village: f.address.village ?? '',
    taluk: f.address.taluk ?? '',
    district: f.address.district,
    addressLine1: f.address.line1 ?? '',
    pincode: f.address.pincode ?? '',
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

/** A real `YYYY-MM-DD` calendar date not after today (same rule as the application's step-1 dob). */
function isRealPastDate(iso: string, today: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return real && iso <= today;
}
